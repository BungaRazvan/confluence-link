import {
	Editor,
	MarkdownEditView,
	MarkdownView,
	Plugin,
	TFile,
} from "obsidian";

import { Obs2ConFluxSettingsTab } from "lib/settings";
import { Obs2ConFluxSettings } from "lib/confluence/types";
import ConfluenceClient from "lib/confluence/client";
import PropertiesAdaptor from "lib/adaptors/properties";

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

		// Register commands
		this.addCommand({
			id: "upload-file-to-confluence",
			name: "Upload file to confluence",
			editorCallback: async (editor: Editor, ctx: MarkdownView) => {
				const file = this.app.vault.getAbstractFileByPath(
					ctx.file?.path || ""
				);

				if (!(file instanceof TFile)) {
					throw new Error("Not a TFile");
				}

				console.log(ctx);

				const fileData = await this.app.vault.read(file);
				const client = new ConfluenceClient({
					host: this.settings.confluenceDomain,
					authentication: {
						email: this.settings.atlassianUsername,
						apiToken: this.settings.atlassianApiToken,
					},
				});
				const props = new PropertiesAdaptor()
					.loadProperties(fileData)
					.addProperties({
						test5: undefined,
						tes56: "hey",
					});

				// Write the updated content back to the Obsidian file
				await this.app.vault.modify(file, props.toFile(fileData));

				// client.page.createPage({
				// 	spaceId: 1376263,
				// 	pageTitle: file.name,
				// });
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
