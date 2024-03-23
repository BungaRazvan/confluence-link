import ADFBuilder from "../builder/adf";
import { ListItemElement, TaskItemElement } from "lib/builder/types";
import { App, Component, MarkdownRenderer } from "obsidian";

export default class FileAdaptor {
	constructor(private app: App) {
		this.app = app;
	}

	convertObs2Adf(text: string, path: string) {
		const container = document.createElement("div");
		MarkdownRenderer.render(
			this.app,
			text,
			container,
			path,
			new Component()
		);
		console.log(container);
		return this.htmlToAdf(container);
	}

	htmlToAdf(container: HTMLElement) {
		const builder = new ADFBuilder();
		container.childNodes.forEach((node: HTMLElement) => {
			this.traverse(node, builder);
		});
		return builder.build();
	}

	traverse(node: HTMLElement, builder: ADFBuilder) {
		console.log({ node });

		switch (node.nodeName) {
			case "H1":
			case "H2":
			case "H3":
			case "H4":
			case "H5":
			case "H6":
				builder.addHeading(Number(node.nodeName[1]), node.textContent!);
				break;
			case "TABLE":
				const tableRows = Array.from(node.querySelectorAll("tr"));
				const tableContent = tableRows.map((row) => {
					const cells = Array.from(
						row.querySelectorAll("td, th")
					).map((cell) => cell.textContent!);
					return builder.addTableRow(cells);
				});
				builder.addTable(tableContent);
				break;
			case "PRE":
				const codeElement = node.querySelector("code");
				if (
					codeElement &&
					!codeElement.classList.contains("language-yaml")
				) {
					const codeText = codeElement.textContent || "";
					builder.addCodeBlock(codeText);
				}
				break;
			case "EM":
				const emText = node.textContent || "";
				builder.addEmphasis(emText);
				break;
			case "CODE":
				const codeText = node.textContent || "";
				builder.addCodeBlock(codeText);
				break;
			case "P":
				const textNodes = Array.from(node.childNodes).filter(
					(child) => child.nodeType === Node.TEXT_NODE
				);
				const text = textNodes
					.map((textNode) => textNode.textContent)
					.join("");
				const inlineElements = Array.from(node.childNodes).filter(
					(child) => child.nodeType === Node.ELEMENT_NODE
				);
				builder.addParagraph(text);
				inlineElements.forEach((inlineElement) => {
					this.traverse(inlineElement as HTMLElement, builder);
				});
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
					builder.addTaskList(listItems as TaskItemElement[]);
					break;
				} else if (node.nodeName === "OL") {
					builder.addOrderedList(listItems as ListItemElement[]);
					break;
				} else {
					builder.addBulletList(listItems as ListItemElement[]);
					break;
				}

			case "A":
				const linkEl = node as HTMLAnchorElement;
				const href = linkEl.href || "";
				const linkText = node.textContent || "";

				if (linkEl.classList.contains("internal-link")) {
					console.log("here");
				}

				builder.addLink(linkText, href);
				break;
			case "BLOCKQUOTE":
				builder.addBlockquote(node.textContent!);
				break;
			case "HR":
				builder.addHorizontalRule();
				break;
			case "STRONG":
				builder.addStrong(node.textContent!);
				break;
		}
	}
}
