import { App, Component, MarkdownRenderer, Notice, TFile } from "obsidian";

import ADFBuilder from "lib/builder/adf";
import {
	AdfElement,
	ListItemElement,
	MarksList,
	TaskItemElement,
} from "lib/builder/types";
import ConfluenceClient from "lib/confluence/client";
import PropertiesAdaptor from "./properties";
import ParagraphDirector from "lib/directors/paragraph";

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
		const adf = await this.htmlToAdf(container, path);
		console.log(adf);
		return adf;
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

	async getConfluenceLink(path: string): Promise<string> {
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

	async findNestedElement(
		node: HTMLElement,
		builder: ADFBuilder,
		filePath: string
	): Promise<Record<string, any>> {
		let item: any = null;
		let type = null;

		switch (node.nodeName) {
			case "A":
				const linkEl = node as HTMLAnchorElement;
				const linkText = node.textContent!;

				// TODO add tag/label support
				if (linkEl.classList.contains("tag")) {
					break;
				}

				if (!this.followLinks) {
					break;
				}

				const href = await this.findLink(linkEl);

				if (
					linkEl.classList.contains("internal-link") &&
					linkEl.getAttr("href") == linkEl.getAttr("data-href")
				) {
					item = builder.cardItem(href);
					type = "inline";
					break;
				}

				item = builder.linkItem(linkText, href);
				type = "inline";
				break;
			case "STRONG":
				item = builder.strongItem(node.textContent!);
				type = "inline";
				break;
			case "EM":
				item = builder.emphasisItem(node.textContent!);
				type = "inline";
				break;
			case "CODE":
				item = builder.codeItem(node.textContent!);
				type = "inline";
				break;
			case "U":
				item = builder.underlineItem(node.textContent!);
				type = "inline";
				break;
			case "S":
				item = builder.strikeItem(node.textContent!);
				type = "inline";
				break;
			case "SPAN":
				const file = this.app.metadataCache.getFirstLinkpathDest(
					filePath,
					"."
				);

				if (!(file instanceof TFile)) {
					break;
				}

				const formData = new FormData();
				const fileData = await this.app.vault.read(file);
				const props = new PropertiesAdaptor().loadProperties(fileData);
				const pageId = props.properties.pageId;
				const src = node.getAttr("src")!;

				const canvasEmbed = node.classList.contains("canvas-embed");
				const imageEmbed = node.classList.contains("image-embed");
				const pdfEmbed = node.classList.contains("pdf-embed");
				const videoEmbed = node.classList.contains("video-embed");
				const modEmpty = node.classList.contains(
					"mod-empty-attachment"
				);

				if (modEmpty) {
					break;
				} else if (canvasEmbed) {
					// TODO figure out canvas
					break;

					if (!this.followLinks) {
						break;
					}

					const canvasFile = this.app.vault.getFileByPath(src);

					await this.app.workspace.openLinkText(src!, ".", true, {
						state: false,
						eState: "hidden",
						active: false,
					});

					// console.log(
					// 	this.app.workspace.getLeavesOfType("canvas")[0].view
					// 		.contentEl
					// );
					// this.app.workspace.detachLeavesOfType("canvas");
				} else if (imageEmbed) {
					const imgFile = this.app.metadataCache.getFirstLinkpathDest(
						src,
						"."
					);

					if (!imgFile) {
						console.error("not know path", node);
						break;
					}

					const fileData = new File(
						[await this.app.vault.readBinary(imgFile)],
						imgFile.name
					);

					formData.append("file", fileData);
				} else if (pdfEmbed || videoEmbed) {
					const fileEmbed =
						this.app.metadataCache.getFirstLinkpathDest(src, ".");

					if (!fileEmbed) {
						console.error("not know path", node);
						break;
					}

					const fileData = new File(
						[await this.app.vault.readBinary(fileEmbed)],
						fileEmbed.name
					);

					formData.append("file", fileData);
				}

				const attachmentResponse =
					await this.client.attachement.uploadFile(
						pageId as string,
						formData
					);
				const { extensions } = attachmentResponse!.results[0];
				item = builder.mediaSingleItem(
					extensions.fileId,
					extensions.collectionName
				);
				type = "block";
				break;
		}

		if (item && type == "inline") {
			const extraMarks = await this.findAllMarks(node, builder);

			if (extraMarks.length > 0) {
				item = {
					...item,
					marks: [...item.marks, ...extraMarks], // @ts-nocheck
				};
			}
		}

		return { item, type };
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
				console.log(paths, paths.length, newPageLink);

				if (newPageLink) {
					href =
						(await this.getConfluenceLink(paths[0] + ".md")) +
						"#" +
						paths[1];

					href = href.replaceAll(" ", "-");
				} else {
					href = dataLink.replaceAll(" ", "-");
				}
			} else {
				href = await this.getConfluenceLink(
					linkEl.dataset.href! + ".md"
				);
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
				const paragraphDirector = new ParagraphDirector(
					builder,
					this,
					this.app,
					this.client
				);
				await paragraphDirector.addItems(
					node as HTMLParagraphElement,
					filePath,
					this.followLinks
				);

				break;

				let needsToAdd = false;

				for (const _node of Array.from(node.childNodes)) {
					const elementNode = _node as HTMLElement;

					if (elementNode.nodeType == Node.TEXT_NODE) {
						p.content.push(
							builder.textItem(elementNode.textContent!)
						);
						needsToAdd = true;
						continue;
					}

					if (elementNode.nodeType == Node.ELEMENT_NODE) {
						let { item, type } = await this.findNestedElement(
							elementNode,
							builder,
							filePath
						);

						if (item && type == "inline") {
							p.content.push(item!);
							needsToAdd = true;
						} else if (item) {
							builder.addItem(p);
							builder.addItem(item);
							needsToAdd = false;
						}
					}
				}

				if (needsToAdd) {
					builder.addItem(p);
				}
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
