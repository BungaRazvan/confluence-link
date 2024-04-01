import { App, Component, MarkdownRenderer, Notice, TFile } from "obsidian";

import ADFBuilder from "../builder/adf";
import {
	AdfElement,
	EmphasisElement,
	LinkElement,
	ListItemElement,
	TaskItemElement,
	TextElement,
} from "lib/builder/types";
import ConfluenceClient from "lib/confluence/client";
import PropertiesAdaptor from "./properties";

export default class FileAdaptor {
	constructor(
		private readonly app: App,
		private readonly client: ConfluenceClient,
		private readonly spaceId: number
	) {
		this.app = app;
		this.client = client;
		this.spaceId = spaceId;
	}

	async convertObs2Adf(text: string, path: string): Promise<AdfElement[]> {
		const container = document.createElement("div");

		MarkdownRenderer.render(
			this.app,
			text,
			container,
			path,
			new Component()
		);
		return await this.htmlToAdf(container);
	}

	async htmlToAdf(container: HTMLElement): Promise<AdfElement[]> {
		const builder = new ADFBuilder();

		for (const node of Array.from(container.childNodes)) {
			await this.traverse(node as HTMLElement, builder);
		}

		return builder.build();
	}

	async getInternalLink(path: string): Promise<string> {
		const file = this.app.metadataCache.getFirstLinkpathDest(path, ".");

		if (!(file instanceof TFile)) {
			return "#";
		}
		const fileData = await this.app.vault.read(file);
		const props = new PropertiesAdaptor().loadProperties(fileData);
		let { confluenceUrl } = props.properties;

		if (confluenceUrl) {
			return confluenceUrl as string;
		}

		const response = await this.client.page.createPage({
			spaceId: this.spaceId,
			pageTitle: file.name,
		});
		confluenceUrl = response._links.base + response._links.webui;

		props.addProperties({
			pageId: response.id,
			spaceId: response.spaceId,
			confluenceUrl,
		});
		await this.app.vault.modify(file, props.toFile(fileData));

		const adf = await this.convertObs2Adf(fileData, path);

		await this.client.page.updatePage({
			pageId: Number(props.properties.pageId),
			pageTitle: file.name,
			adf,
		});

		new Notice(`Page Created: ${file.name}`);
		return confluenceUrl as string;
	}

	async findInlineElement(
		node: HTMLElement,
		builder: ADFBuilder
	): Promise<TextElement | LinkElement | EmphasisElement | null> {
		let item = null;

		switch (node.nodeName) {
			case "A":
				const linkEl = node as HTMLAnchorElement;
				let href = linkEl.href!;
				const linkText = node.textContent!;

				if (linkEl.classList.contains("internal-link")) {
					href = await this.getInternalLink(
						linkEl.dataset.href! + ".md"
					);
				}
				item = builder.linkItem(linkText, href);
				break;
			case "STRONG":
				item = builder.strongItem(node.textContent!);
				break;
			case "EM":
				item = builder.emphasisItem(node.textContent!);
				break;
			case "CODE":
				item = builder.codeItem(node.textContent!);
				break;
			case "U":
				item = builder.underlineItem(node.textContent!);
				break;
			case "S":
				item = builder.strikeItem(node.textContent!);
				break;
		}

		return item;
	}

	async traverse(node: HTMLElement, builder: ADFBuilder) {
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
				const tableContent = tableRows.map((row) => {
					const cells = Array.from(
						row.querySelectorAll("td, th")
					).map((cell) => cell.textContent!);
					return builder.tableRowItem(cells);
				});
				builder.addItem(builder.tableItem(tableContent));
				break;
			case "PRE":
				const codeElement = node.querySelector("code");
				if (
					codeElement &&
					!codeElement.classList.contains("language-yaml")
				) {
					const codeText = codeElement.textContent || "";
					builder.addItem(builder.codeBlockItem(codeText));
				}
				break;
			case "P":
				const p = builder.paragraphItem();

				for (const _node of Array.from(node.childNodes)) {
					const elementNode = _node as HTMLElement;

					if (_node.nodeType == Node.TEXT_NODE) {
						p.content.push(
							builder.textItem(elementNode.textContent!)
						);

						continue;
					}

					if (_node.nodeType == Node.ELEMENT_NODE) {
						let item = await this.findInlineElement(
							_node as HTMLElement,
							builder
						);

						if (item) {
							p.content.push(item!);
						}
					}
				}

				builder.addItem(p);
				break;

			case "OL":
			case "UL":
				let isTaskList = false;
				const listItems = Array.from(node.querySelectorAll("li")).map(
					(li) => {
						isTaskList = li.classList.contains("task-list-item");

						if (isTaskList) {
							return builder.taskItem(
								li.textContent?.trim()!,
								Boolean(li.getAttr("data-task"))
							);
						}

						return builder.listItem(li.textContent!);
					}
				);
				if (isTaskList) {
					builder.addItem(
						builder.taskListItem(listItems as TaskItemElement[])
					);
					break;
				} else if (node.nodeName === "OL") {
					builder.addItem(
						builder.orderedListItem(listItems as ListItemElement[])
					);
					break;
				} else {
					builder.addItem(
						builder.bulletListItem(listItems as ListItemElement[])
					);
					break;
				}
			case "BLOCKQUOTE":
				builder.addItem(builder.blockquoteItem(node.textContent!));
				break;
			case "HR":
				builder.addItem(builder.horizontalRuleItem());
				break;
		}
	}
}
