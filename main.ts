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

export default class Obs2ConFluxPlugin extends Plugin {
	settings: Obs2ConFluxSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new Obs2ConFluxSettingsTab(this.app, this));

		const ribbonIconEl = this.addRibbonIcon(
			"file-up",
			"Upload file to confluence",
			(evt: MouseEvent) => {
				console.log(evt);
			}
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

				const fileData = await this.app.vault.read(file);

				// this.app.vault.modify(file, fileData + "\nhello");

				const client = new ConfluenceClient({
					host: this.settings.confluenceDomain,
					authentication: {
						email: this.settings.atlassianUsername,
						apiToken: this.settings.atlassianApiToken,
					},
				});
				console.log(file.name);

				client.page.createPage({
					spaceId: 1376263,
					pageTitle: file.name,
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

	async loadMarkdownFile(absoluteFilePath: string): Promise<MarkdownFile> {
		const file = this.app.vault.getAbstractFileByPath(absoluteFilePath);
		if (!(file instanceof TFile)) {
			throw new Error("Not a TFile");
		}

		const fileFM = this.metadataCache.getCache(file.path);
		if (!fileFM) {
			throw new Error("Missing File in Metadata Cache");
		}
		const frontMatter = fileFM.frontmatter;

		const parsedFrontMatter: Record<string, unknown> = {};
		if (frontMatter) {
			for (const [key, value] of Object.entries(frontMatter)) {
				parsedFrontMatter[key] = value;
			}
		}

		return {
			pageTitle: file.basename,
			folderName: file.parent.name,
			absoluteFilePath: file.path,
			fileName: file.name,
			contents: await this.vault.cachedRead(file),
			frontmatter: parsedFrontMatter,
		};
	}
}
