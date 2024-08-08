import ADFBuilder from "lib/builder/adf";
import { MarksList } from "lib/builder/types";
import LinkDirector from "./link";
import FileAdaptor from "lib/adaptors/file";
import MediaDirector from "./media";
import { App } from "obsidian";
import ConfluenceClient from "lib/confluence/client";

class ParagraphDirector {
	constructor(
		private readonly builder: ADFBuilder,
		private readonly fileAdaptor: FileAdaptor,
		private readonly app: App,
		private readonly client: ConfluenceClient
	) {}

	async addItems(
		node: HTMLParagraphElement,
		filePath: string,
		followLinks: boolean
	) {
		const pItem = this.builder.paragraphItem();

		for (const innerNode of Array.from(node.childNodes)) {
			if (innerNode.nodeType === Node.TEXT_NODE) {
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
					followLinks
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

	async findNestedItem(node: HTMLElement, followLinks: boolean) {
		let item: any = null;

		switch (node.nodeName) {
			case "A":
				item = await new LinkDirector(
					this.builder,
					this.fileAdaptor
				).build_item(node as HTMLAnchorElement, followLinks);
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
}

export default ParagraphDirector;
