import {
	Editor,
	Notice,
	Plugin,
	TFile,
	FileView,
	MarkdownView,
} from "obsidian";

import { Obs2ConFluxSettingsTab } from "lib/settings";
import { Obs2ConFluxSettings } from "lib/confluence/types";

import ConfluenceClient from "lib/confluence/client";
import PropertiesAdaptor from "lib/adaptors/properties";
import FileAdaptor from "lib/adaptors/file";
import SpaceSearchModal from "lib/modal";
import { toBlob, toPng } from "html-to-image";

export default class Obs2ConFluxPlugin extends Plugin {
	settings: Obs2ConFluxSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new Obs2ConFluxSettingsTab(this.app, this));

		// Register commands
		this.addCommand({
			id: "upload-file-to-confluence",
			name: "Upload file to confluence using default space",
			editorCallback: async (editor: Editor, ctx: MarkdownView) => {
				const { confluenceDefaultSpaceId } = this.settings;

				this.uploadFile(ctx.file?.path || "", confluenceDefaultSpaceId);
			},
		});

		this.addCommand({
			id: "upload-file-to-space",
			name: "Upload file to space",
			editorCallback: async (editor: Editor, ctx: MarkdownView) => {
				this.uploadFile(ctx.file?.path || "", null);
			},
		});
	}

	getActiveCanvas(): any {
		let currentView = this.app.workspace?.getActiveViewOfType(FileView);

		if (currentView?.getViewType() !== "canvas") {
			return null;
		}

		return (currentView as any)["canvas"];
	}

	async uploadFile(filePath: string, spaceId: string | null) {
		const {
			atlassianUsername,
			atlassianApiToken,
			confluenceDomain,
			followLinks,
		} = this.settings;

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
		const props = new PropertiesAdaptor().loadProperties(fileData);
		const { pageId } = props.properties;

		let response = null;

		if (!spaceId && !pageId) {
			await new Promise<void>((resolve) => {
				new SpaceSearchModal(this.app, client, (result) => {
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

			props.addProperties({
				pageId: response.id,
				spaceId: response.spaceId,
				confluenceUrl: response._links.base + response._links.webui,
			});
		}

		// Write the updated content back to the Obsidian file
		await this.app.vault.modify(file, props.toFile(fileData));

		const adf = await new FileAdaptor(
			this.app,
			client,
			spaceId as string,
			followLinks
		).convertObs2Adf(fileData, filePath || "");
		console.log(adf);

		client.page.updatePage({
			pageId: props.properties.pageId as string,
			pageTitle: file.name.replace(".md", ""),
			adf,
		});

		new Notice(`File uploaded to confluence`);
	}

	async onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
