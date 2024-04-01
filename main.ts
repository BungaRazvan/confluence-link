import { Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";

import { Obs2ConFluxSettingsTab } from "lib/settings";
import { Obs2ConFluxSettings } from "lib/confluence/types";
import ConfluenceClient from "lib/confluence/client";
import PropertiesAdaptor from "lib/adaptors/properties";
import FileAdaptor from "lib/adaptors/file";
import SpaceSearchModal from "lib/modal";

export default class Obs2ConFluxPlugin extends Plugin {
	settings: Obs2ConFluxSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new Obs2ConFluxSettingsTab(this.app, this));

		const ribbonIconEl = this.addRibbonIcon(
			"file-up",
			"Upload file to confluence",
			(evt: MouseEvent) => {}
		);

		this.addCommand({
			id: "test-link",
			name: "test-link",
			editorCallback: async (editor, ctx) => {
				const adf = [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "This is page 1",
							},
						],
					},
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "to ",
							},
						],
					},
					{
						type: "text",
						text: "Page 2",
						marks: [
							{
								type: "link",
								attrs: {
									href: "https://razvanbunga.atlassian.net/wiki/spaces/~5f785303b61f66006f163366/pages/5603440/Page+2.md",
								},
							},
						],
					},
				];

				const {
					atlassianUsername,
					atlassianApiToken,
					confluenceDomain,
					confluenceDefaultSpaceId,
				} = this.settings;

				const client = new ConfluenceClient({
					host: confluenceDomain,
					authentication: {
						email: atlassianUsername,
						apiToken: atlassianApiToken,
					},
				});

				const file = this.app.vault.getAbstractFileByPath(
					ctx.file?.path || ""
				);

				const fileData = await this.app.vault.read(file);

				const props = new PropertiesAdaptor().loadProperties(fileData);

				await client.page.updatePage({
					pageId: Number(props.properties.pageId),
					pageTitle: file.name,
					adf,
				});
			},
		});

		// Register commands
		this.addCommand({
			id: "upload-file-to-confluence",
			name: "Upload file to confluence",
			editorCallback: async (editor: Editor, ctx: MarkdownView) => {
				const {
					atlassianUsername,
					atlassianApiToken,
					confluenceDomain,
					confluenceDefaultSpaceId,
				} = this.settings;

				if (
					!atlassianApiToken ||
					!atlassianUsername ||
					!confluenceDomain
				) {
					new Notice(
						"Settings not set up. Please open the settings page of the plugin"
					);
					return;
				}

				const file = this.app.vault.getAbstractFileByPath(
					ctx.file?.path || ""
				);

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

				let { pageId } = props.properties;
				let response = null;
				let spaceId = confluenceDefaultSpaceId || null;

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
						spaceId: Number(spaceId),
						pageTitle: file.name,
					});

					props.addProperties({
						pageId: response.id,
						spaceId: response.spaceId,
						confluenceUrl:
							response._links.base + response._links.webui,
					});
				}

				// Write the updated content back to the Obsidian file
				await this.app.vault.modify(file, props.toFile(fileData));

				const adf = await new FileAdaptor(
					this.app,
					client,
					Number(spaceId)
				).convertObs2Adf(fileData, ctx.file?.path || "");

				client.page.updatePage({
					pageId: Number(props.properties.pageId),
					pageTitle: file.name,
					adf,
				});
			},
		});
	}

	async onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
