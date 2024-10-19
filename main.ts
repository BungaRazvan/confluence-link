import {
	Editor,
	Notice,
	Plugin,
	TFile,
	FileView,
	MarkdownView,
	setIcon,
} from "obsidian";

import { ConfluenceLinkSettingsTab } from "lib/settings";
import { ConfluenceLinkSettings } from "lib/confluence/types";

import ConfluenceClient from "lib/confluence/client";
import PropertiesAdaptor from "lib/adaptors/properties";
import FileAdaptor from "lib/adaptors/file";
import SpaceSearchModal from "lib/modal";
import LabelDirector from "lib/directors/label";

export default class ConfluenceLink extends Plugin {
	settings: ConfluenceLinkSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new ConfluenceLinkSettingsTab(this.app, this));

		// Register commands
		this.addCommand({
			id: "upload-file-to-confluence",
			name: "Upload file to confluence using default space",
			editorCallback: (editor: Editor, ctx: MarkdownView) => {
				const { confluenceDefaultSpaceId } = this.settings;

				this.addProgress(
					async () =>
						this.uploadFile(
							ctx.file?.path || "",
							confluenceDefaultSpaceId
						),
					ctx.file?.name!
				);
			},
		});

		this.addCommand({
			id: "upload-file-to-space",
			name: "Upload file to space",
			editorCallback: (editor: Editor, ctx: MarkdownView) => {
				this.addProgress(
					async () => this.uploadFile(ctx.file?.path || "", null),
					ctx.file?.name!
				);
			},
		});
	}

	async addProgress(callback: Function, filename: string) {
		const statusBar = this.addStatusBarItem();

		setIcon(statusBar, "loader");
		const loader = statusBar.querySelector("svg")!;

		statusBar.createEl("span", {
			text: `Uploading ${filename}`,
			attr: { style: "padding-rigth: 10px; padding-left: 5px" },
		});
		loader.animate(
			[
				{
					// from
					transform: "rotate(0deg)",
				},
				{
					// to
					transform: "rotate(360deg)",
				},
			],
			{
				duration: 2000,
				iterations: Infinity, // Repeat the animation infinitely
			}
		);

		try {
			await callback();
		} catch (e) {
			console.error(e);
			statusBar.detach();
			return;
		}

		statusBar.detach();
	}

	getActiveCanvas(): any {
		let currentView = this.app.workspace?.getActiveViewOfType(FileView);

		if (currentView?.getViewType() !== "canvas") {
			return null;
		}

		return (currentView as any)["canvas"];
	}

	async uploadFile(filePath: string, spaceId: string | null) {
		const { atlassianUsername, atlassianApiToken, confluenceDomain } =
			this.settings;

		if (!atlassianApiToken || !atlassianUsername || !confluenceDomain) {
			new Notice(
				"Settings not set up. Please open the settings page of the plugin"
			);
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(filePath || "");

		if (!(file instanceof TFile)) {
			throw new Error("Not a TFile");
		}

		const fileData = await this.app.vault.read(file);
		const client = new ConfluenceClient({
			host: confluenceDomain,
			authentication: {
				email: atlassianUsername,
				apiToken: atlassianApiToken,
			},
		});

		const propAdaptor = new PropertiesAdaptor().loadProperties(fileData);
		const { pageId, tags } = propAdaptor.properties;

		let response = null;

		if (!spaceId && !pageId) {
			await new Promise<void>((resolve) => {
				new SpaceSearchModal(this.app, this, client, (result) => {
					spaceId = result.id;
					resolve();
				}).open();
			});
		}

		if (!pageId) {
			response = await client.page.createPage({
				spaceId: spaceId as string,
				pageTitle: file.name.replace(".md", ""),
			});

			propAdaptor.addProperties({
				pageId: response.id,
				spaceId: response.spaceId,
				confluenceUrl: response._links.base + response._links.webui,
			});
		}

		// Write the updated content back to the Obsidian file
		await this.app.vault.modify(file, propAdaptor.toFile(fileData));

		const adf = await new FileAdaptor(
			this.app,
			client,
			spaceId as string,
			this.settings
		).convertObs2Adf(fileData, filePath || "");

		client.page.updatePage({
			pageId: propAdaptor.properties.pageId as string,
			pageTitle: file.name.replace(".md", ""),
			adf,
		});

		if (tags) {
			new LabelDirector(this.app, client).addTags(
				filePath,
				this.settings.uploadTags
			);
		}

		new Notice(`File uploaded to confluence`);
	}

	async onunload() {}

	async loadSettings() {
		this.settings = Object.assign({ favSpaces: [] }, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
