import {
	App,
	Component,
	MarkdownRenderer,
	Notice,
	TFile,
	FileView,
	Events,
} from "obsidian";

import ADFBuilder from "../builder/adf";
import {
	AdfElement,
	CardElementLink,
	ListItemElement,
	MarkedElement,
	MarksList,
	TaskItemElement,
} from "lib/builder/types";
import ConfluenceClient from "lib/confluence/client";
import PropertiesAdaptor from "./properties";

export default class FileAdaptor {
	constructor(
		private readonly app: App,
		private readonly client: ConfluenceClient,
		private readonly spaceId: string,
		private readonly followLinks: boolean
	) {
		this.app = app;
		this.client = client;
		this.spaceId = spaceId;
		this.followLinks = followLinks;
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

		console.log(container);
		return await this.htmlToAdf(container, path);
	}

	async htmlToAdf(
		container: HTMLElement,
		filePath: string
	): Promise<AdfElement[]> {
		const builder = new ADFBuilder();

		for (const node of Array.from(container.childNodes)) {
			await this.traverse(node as HTMLElement, builder, filePath);
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
			pageId: props.properties.pageId as string,
			pageTitle: file.name,
			adf,
		});

		new Notice(`Page Created: ${file.name}`);
		return confluenceUrl as string;
	}

	async findInlineElement(
		node: HTMLElement,
		builder: ADFBuilder,
		filePath: string
	): Promise<MarkedElement | CardElementLink | null> {
		let item = null;

		switch (node.nodeName) {
			case "A":
				if (!this.followLinks) {
					return null;
				}

				const linkEl = node as HTMLAnchorElement;
				const linkText = node.textContent!;

				const href = await this.findLink(linkEl);

				if (
					linkEl.classList.contains("internal-link") &&
					linkEl.getAttr("href") == linkText.replaceAll(" > ", "#")
				) {
					return builder.cardItem(href);
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
			case "SPAN":
				const canvasEmbed = node.classList.contains("canvas-embed");
				const imageEmbed = node.classList.contains("image-embed");
				const pdfEmbed = node.classList.contains("pdf-embed");

				const file = this.app.metadataCache.getFirstLinkpathDest(
					filePath,
					"."
				);

				if (!(file instanceof TFile)) {
					break;
				}

				const fileData = await this.app.vault.read(file);
				const props = new PropertiesAdaptor().loadProperties(fileData);
				const pageId = props.properties.pageId;
				let attachmentResponse = null;

				if (canvasEmbed) {
					if (!this.followLinks) {
						return null;
					}

					const canvasFile = this.app.vault.getFileByPath(
						node.getAttr("src")!
					);

					console.log(canvasFile);

					return;

					await this.app.workspace.openLinkText(
						node.getAttr("src")!,
						".",
						true,
						{
							state: false,
							eState: "hidden",
							active: false,
						}
					);

					console.log(
						this.app.workspace.getLeavesOfType("canvas")[0].view
							.contentEl
					);

					// this.app.workspace.detachLeavesOfType("canvas");
				} else if (imageEmbed) {
					const imgFile = this.app.metadataCache.getFirstLinkpathDest(
						node.getAttr("src")!,
						"."
					);

					if (!imgFile) {
						console.log("not know path", node);
						break;
					}

					attachmentResponse =
						await this.client.attachement.uploadImage(
							pageId as string,
							await this.app.vault.readBinary(imgFile),
							imgFile.basename,
							imgFile.extension
						);
				} else if (pdfEmbed) {
				}

				if (!attachmentResponse) {
					break;
				}

				const { extensions } = attachmentResponse!.results[0];
				item = builder.mediaSingleItem(
					extensions.fileId,
					extensions.collectionName
				);
				builder.addItem(item);
				item = null;
				break;
		}

		if (item) {
			const extraMarks = await this.findAllMarks(node, builder);

			if (extraMarks.length > 0) {
				item = {
					...item,
					marks: [...item.marks!, ...extraMarks],
				};
			}
		}

		return item as MarkedElement;
	}

	async findAllMarks(
		node: HTMLElement,
		builder: ADFBuilder
	): Promise<MarksList> {
		let marks: MarksList = [];

		for (const _node of Array.from(node.childNodes)) {
			if (_node.nodeType == Node.TEXT_NODE) {
				break;
			}

			if (_node.nodeType == Node.ELEMENT_NODE) {
				switch (_node.nodeName) {
					case "A":
						const link = await this.findLink(
							_node as HTMLAnchorElement
						);
						marks.push(builder.markLink(link));
						break;
					case "STRONG":
						marks.push(builder.markStrong());
						break;
					case "EM":
						marks.push(builder.markEm());
						break;
					case "CODE":
						marks.push(builder.markCode());
						break;
					case "U":
						marks.push(builder.markUnderline());
						break;
					case "S":
						marks.push(builder.markStrike());
						break;
				}

				const moreMarks = await this.findAllMarks(
					_node as HTMLElement,
					builder
				);

				if (moreMarks.length > 0) {
					marks = marks.concat(moreMarks);
				}
			}
		}

		return marks;
	}

	async findLink(linkEl: HTMLAnchorElement): Promise<string> {
		let href = linkEl.href!;

		if (linkEl.classList.contains("internal-link")) {
			const dataLink = linkEl.getAttr("data-href")!;

			if (dataLink.contains("#")) {
				const paths = dataLink.split("#");
				const newPageLink = paths.length > 1;

				if (newPageLink) {
					href =
						(await this.getInternalLink(paths[0] + ".md")) +
						"#" +
						paths[1];

					href = href.replaceAll(" ", "-");
				} else {
					href = dataLink.replaceAll(" ", "-");
				}
			} else {
				href = await this.getInternalLink(linkEl.dataset.href! + ".md");
			}
		}

		return href;
	}

	async traverse(node: HTMLElement, builder: ADFBuilder, filePath: string) {
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
							builder,
							filePath
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
