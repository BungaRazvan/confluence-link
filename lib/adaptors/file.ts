import { App, Component, MarkdownRenderer, Notice, TFile } from "obsidian";
import ADFBuilder from "lib/builder/adf";
import { AdfElement } from "lib/builder/types";
import ConfluenceClient from "lib/confluence/client";
import PropertiesAdaptor from "./properties";
import ParagraphDirector from "lib/directors/paragraph";
import { ConfluenceLinkSettings } from "lib/confluence/types";
import TableDirector from "lib/directors/table";
import { MardownLgToConfluenceLgMap } from "lib/utils";
import { find } from "lodash";
import ListDirector from "lib/directors/list";
import LabelDirector from "lib/directors/label";

export default class FileAdaptor {
	constructor(
		private readonly app: App,
		private readonly client: ConfluenceClient,
		private readonly spaceId: string,
		private readonly settings: ConfluenceLinkSettings
	) {}

	async convertObs2Adf(
		text: string,
		path: string,
		propertiesAdaptor: PropertiesAdaptor
	): Promise<AdfElement[]> {
		const container = document.createElement("div");

		MarkdownRenderer.render(
			this.app,
			text,
			container,
			path,
			new Component()
		);
		const adf = await this.htmlToAdf(container, path, propertiesAdaptor);
		return adf;
	}

	async htmlToAdf(
		container: HTMLElement,
		filePath: string,
		propertiesAdaptor: PropertiesAdaptor
	): Promise<AdfElement[]> {
		const builder = new ADFBuilder();
		const labelDirector = new LabelDirector(this.client, propertiesAdaptor);

		for (const node of Array.from(container.childNodes)) {
			await this.traverse(
				node as HTMLElement,
				builder,
				filePath,
				labelDirector
			);
		}

		if (this.settings.uploadTags && labelDirector.allTags.length > 0) {
			await labelDirector.updateConfluencePage();
		}

		return builder.build();
	}

	async getConfluenceLink(path: string): Promise<string> {
		const file = this.app.metadataCache.getFirstLinkpathDest(path, ".");

		if (!(file instanceof TFile)) {
			return "#";
		}
		const fileData = await this.app.vault.read(file);
		const propAdaptor = new PropertiesAdaptor().loadProperties(fileData);
		let { confluenceUrl } = propAdaptor.properties;

		if (confluenceUrl) {
			return confluenceUrl as string;
		}

		const response = await this.client.page.createPage({
			spaceId: this.spaceId,
			pageTitle: file.basename,
		});
		confluenceUrl = response._links.base + response._links.webui;

		propAdaptor.addProperties({
			pageId: response.id,
			spaceId: response.spaceId,
			confluenceUrl,
		});
		await this.app.vault.modify(file, propAdaptor.toFile(fileData));

		const adf = await this.convertObs2Adf(fileData, path, propAdaptor);

		await this.client.page.updatePage({
			pageId: propAdaptor.properties.pageId as string,
			pageTitle: file.basename,
			adf,
		});

		new Notice(`Page Created: ${file.basename}`);
		return confluenceUrl as string;
	}

	async traverse(
		node: HTMLElement,
		builder: ADFBuilder,
		filePath: string,
		labelDirector: LabelDirector
	) {
		switch (node.nodeName) {
			case "H1":
			case "H2":
			case "H3":
			case "H4":
			case "H5":
			case "H6":
				builder.addItem(
					builder.headingItem(
						Number(node.nodeName[1]),
						node.textContent!
					)
				);
				break;
			case "TABLE":
				const tableRows = Array.from(node.querySelectorAll("tr"));
				const tableContent = await Promise.all(
					tableRows.map(async (row) => {
						const cells = await Promise.all(
							Array.from(row.querySelectorAll("td, th")).map(
								async (cell) => {
									const cellAdf = new ADFBuilder();
									const director = new TableDirector(
										cellAdf,
										this,
										this.app,
										this.client,
										this.settings,
										labelDirector
									);

									await director.addItems(
										cell as HTMLTableCellElement,
										filePath
									);

									return cellAdf.build();
								}
							)
						);
						return builder.tableRowItem(cells);
					})
				);
				builder.addItem(builder.tableItem(tableContent));
				break;
			case "PRE":
				const codeElement = node.querySelector("code");

				// skip if pre is for file properties or no code element
				if (node.classList.contains("frontmatter") || !codeElement) {
					break;
				}

				if (codeElement.classList.contains("language-mermaid")) {
					// TODO figure out mermaid
					break;
				}

				const codeText = codeElement.textContent || "";
				const codeLg = find(
					Array.from(codeElement.classList.values()),
					(cls: string) => {
						return cls.startsWith("language-");
					}
				);
				const confluenceLg = codeLg
					? MardownLgToConfluenceLgMap[
							codeLg.replace("language-", "")
					  ]
					: "";

				builder.addItem(builder.codeBlockItem(codeText, confluenceLg));

				break;
			case "P":
				const paragraphDirector = new ParagraphDirector(
					builder,
					this,
					this.app,
					this.client,
					this.settings,
					labelDirector
				);
				await paragraphDirector.addItems(
					node as HTMLParagraphElement,
					filePath
				);

				break;
			case "OL":
			case "UL":
				const listDirector = new ListDirector(
					builder,
					this,
					this.app,
					this.client,
					this.settings,
					labelDirector
				);

				await listDirector.addList(
					node as HTMLUListElement | HTMLOListElement,
					filePath
				);

				break;
			case "BLOCKQUOTE":
				builder.addItem(builder.blockquoteItem(node.textContent!));
				break;
			case "HR":
				builder.addItem(builder.horizontalRuleItem());
				break;
		}
	}
}
