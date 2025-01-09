import { App } from "obsidian";
import { MarksList } from "lib/builder/types";

import ADFBuilder from "lib/builder/adf";
import FileAdaptor from "lib/adaptors/file";
import ConfluenceClient from "lib/confluence/client";

import MediaDirector from "./media";
import LabelDirector from "./label";
import LinkDirector from "./link";
import { ConfluenceLinkSettings } from "lib/confluence/types";

class ParagraphDirector {
	constructor(
		readonly builder: ADFBuilder,
		readonly fileAdaptor: FileAdaptor,
		readonly app: App,
		readonly client: ConfluenceClient,
		readonly settings: ConfluenceLinkSettings,
		readonly labelDirector: LabelDirector
	) {}

	async addItems(
		node: HTMLParagraphElement,
		filePath: string,
		ignoreTags = false
	): Promise<void> {
		const pItem = this.builder.paragraphItem();

		if (
			!ignoreTags &&
			this.settings.uploadTags &&
			this.isTagOnlyParagraph(node)
		) {
			const tags = node.querySelectorAll('a[class="tag"]');
			this.labelDirector.addTags(
				tags as unknown as Array<HTMLAnchorElement>
			);

			return;
		}

		for (const innerNode of Array.from(node.childNodes)) {
			if (
				innerNode.nodeType === Node.TEXT_NODE ||
				this.isTagNode(innerNode as HTMLElement)
			) {
				const textItem = this.builder.textItem(innerNode.textContent!);
				pItem.content.push(textItem);
				continue;
			}

			if (
				innerNode.nodeType === Node.ELEMENT_NODE &&
				innerNode.nodeName !== "SPAN"
			) {
				const nestedItem = await this.findNestedItem(
					innerNode as HTMLElement,
					filePath
				);

				if (nestedItem) {
					pItem.content.push(nestedItem);
				}

				continue;
			}

			if (
				innerNode.nodeType === Node.ELEMENT_NODE &&
				innerNode.nodeName == "SPAN"
			) {
				const dir = new MediaDirector(
					this.builder,
					this.app,
					this.client
				);
				const mediaItem = await dir.build_item(
					innerNode as HTMLSpanElement,
					filePath
				);
				this.builder.addItem(pItem);

				if (mediaItem) {
					this.builder.addItem(mediaItem);
				}

				return;
			}
		}

		this.builder.addItem(pItem);
	}

	isTagNode(node: HTMLElement): boolean {
		return (
			node.nodeType === Node.ELEMENT_NODE &&
			node.nodeName === "A" &&
			node.classList.contains("tag")
		);
	}

	async findNestedItem(node: HTMLElement, filePath: string) {
		let item: any = null;

		switch (node.nodeName) {
			case "A":
				if (node.classList.contains("tag")) {
					break;
				}

				item = await new LinkDirector(
					this.builder,
					this.fileAdaptor
				).build_item(
					node as HTMLAnchorElement,
					this.settings.followLinks,
					filePath
				);
				break;
			case "STRONG":
				item = this.builder.strongItem(node.textContent!);
				break;
			case "EM":
				item = this.builder.emphasisItem(node.textContent!);
				break;
			case "CODE":
				item = this.builder.codeItem(node.textContent!);
				break;
			case "U":
				item = this.builder.underlineItem(node.textContent!);
				break;
			case "S":
			case "DEL":
				item = this.builder.strikeItem(node.textContent!);
				break;
		}

		if (item) {
			const marks = await this.findAllMarks(node);

			if (marks.length > 0) {
				item = {
					...item,
					marks: [...item.marks, ...marks],
				};
			}
		}

		return item;
	}

	async findAllMarks(node: HTMLElement) {
		let marks: MarksList = [];

		for (const _node of Array.from(node.childNodes)) {
			if (_node.nodeType == Node.TEXT_NODE) {
				break;
			}

			if (_node.nodeType == Node.ELEMENT_NODE) {
				switch (_node.nodeName) {
					case "A":
						const link = await new LinkDirector(
							this.builder,
							this.fileAdaptor
						).findLink(_node as HTMLAnchorElement);
						marks.push(this.builder.markLink(link));
					case "STRONG":
						marks.push(this.builder.markStrong());
						break;
					case "EM":
						marks.push(this.builder.markEm());
						break;
					case "CODE":
						marks.push(this.builder.markCode());
						break;
					case "U":
						marks.push(this.builder.markUnderline());
						break;
					case "S":
						marks.push(this.builder.markStrike());
						break;
				}

				const moreMarks = await this.findAllMarks(_node as HTMLElement);

				if (moreMarks.length > 0) {
					marks = marks.concat(moreMarks);
				}
			}
		}

		return marks;
	}

	isTagOnlyParagraph(node: HTMLElement): boolean {
		const childNodes = Array.from(node.childNodes);

		let hasText = false;
		let hasTag = false;

		for (const child of childNodes) {
			if (
				child.nodeType === Node.TEXT_NODE &&
				child.textContent?.trim() !== ""
			) {
				hasText = true;
			} else if (
				child.nodeType === Node.ELEMENT_NODE &&
				(child as HTMLElement).classList.contains("tag")
			) {
				hasTag = true;
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				hasText = true; // If it's another type of element, count it as text content
			}
		}

		// True if it contains only tags and no text content.
		return hasTag && !hasText;
	}
}

export default ParagraphDirector;
