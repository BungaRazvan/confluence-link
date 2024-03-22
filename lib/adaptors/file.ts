import MarkdownIt from "markdown-it";
// @ts-ignore
import MarkdownItMarkPlugin from "markdown-it-mark";

import ADFBuilder from "../builder/adf";
import { ListItemElement, TaskItemElement } from "lib/builder/types";

function traverse(node: HTMLElement, builder: ADFBuilder) {
	console.log(node.nodeName, node.parentElement);

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
				const cells = Array.from(row.querySelectorAll("td, th")).map(
					(cell) => cell.textContent!
				);
				return builder.addTableRow(cells);
			});
			builder.addTable(tableContent);
			break;
		case "PRE":
			const codeElement = node.querySelector("code");
			if (codeElement) {
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
				traverse(inlineElement as HTMLElement, builder);
			});
			break;

		case "OL":
		case "UL":
			let isTaskList = false;
			const listItems = Array.from(node.querySelectorAll("li")).map(
				(li) => {
					const isUnCheckedCheckbox = li
						.textContent!.trim()
						.startsWith("[ ]");
					const isCheckedCheckbox = li
						.textContent!.trim()
						.startsWith("[x]");

					const text = li
						.textContent!.replace("[ ]", "")
						.replace("[x]", "");

					if (isUnCheckedCheckbox || isCheckedCheckbox) {
						isTaskList = true;
						return builder.taskItem(text, isCheckedCheckbox);
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

function htmlToAdf(html: string) {
	const builder = new ADFBuilder();
	const container = document.createElement("div");
	container.innerHTML = html;
	container.childNodes.forEach((node: HTMLElement) => {
		traverse(node, builder);
	});
	return builder.build();
}

function customEmphasisRule(state: any) {
	const start = state.pos;

	// Check if the next two characters are asterisks
	if (
		state.src.charCodeAt(start) === 0x2a /* asterisk */ &&
		state.src.charCodeAt(start + 1) === 0x2a /* asterisk */ &&
		state.src.charCodeAt(start + 2) === 0x2a /* asterisk */
	) {
		// Push both strong and emphasis tokens for ***
		const tokenStrong = state.push("strong_open", "strong", 1);
		tokenStrong.markup = "***";
		tokenStrong.position = start;

		const tokenEm = state.push("em_open", "em", 1);
		tokenEm.markup = "***";
		tokenEm.position = start;

		state.pos += 3;
		state.pending = "";
		return true;
	}

	// Handle single underscores (_) as emphasis
	if (state.src.charCodeAt(start) === 0x5f /* underscore */) {
		const token = state.push("em_open", "em", 1);
		token.markup = "_";
		token.position = start;
		state.pos++;
		state.pending = "";
		return true;
	}

	// Handle single asterisks (*) as strong
	if (state.src.charCodeAt(start) === 0x2a /* asterisk */) {
		const token = state.push("strong_open", "strong", 1);
		token.markup = "*";
		token.position = start;
		state.pos++;
		state.pending = "";
		return true;
	}

	return false;
}

export default class FileAdaptor {
	convertObs2Adf(text: string) {
		const md = new MarkdownIt({
			html: true, // Enable HTML tags in output
			breaks: true, // Convert '\n' in paragraphs into <br>
			linkify: true,
		});
		md.use(MarkdownItMarkPlugin);
		md.inline.ruler.at("emphasis", customEmphasisRule);
		const newText = text.replace(new RegExp(/^---\n([\s\S]+?)\n---\n/), "");
		console.log(md.render(newText));

		return htmlToAdf(md.render(newText));
	}
}
