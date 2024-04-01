import {
	TextElement,
	LinkElement,
	ParagraphElement,
	TableElement,
	HeadingElement,
	CodeBlockElement,
	TaskListItemElement,
	ListItemElement,
	BlockquoteElement,
	TableRowElement,
	TaskItemElement,
	BulletListItemElement,
	OrderedListElement,
	AdfElement,
} from "./types";

export default class ADFBuilder {
	private adf: AdfElement;

	constructor() {
		this.adf = [];
	}

	headingItem(level: number, text: string): HeadingElement {
		const heading = {
			type: "heading",
			content: [{ type: "text", text: text }],
			attrs: { level: level },
		};
		return heading;
	}

	horizontalRuleItem(): this {
		return {
			type: "rule",
		};
	}

	paragraphItem(text?: string): ParagraphElement {
		const paragraph = {
			type: "paragraph",
			content: text ? [{ type: "text", text: text }] : [],
		};
		return paragraph;
	}

	tableItem(tableContent: Array<TableRowElement>): TableElement {
		return {
			type: "table",
			content: tableContent,
		};
	}

	tableRowItem(cells: string[]): TableRowElement {
		const tableRow = {
			type: "tableRow",
			content: cells.map((cellText) => ({
				type: "tableCell",
				attrs: {
					background: "",
					colwidth: [],
					colspan: 1,
					rowspan: 1,
				},
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: cellText || "",
							},
						],
					},
				],
			})),
		};

		return tableRow;
	}

	codeBlockItem(codeText: string): CodeBlockElement {
		return {
			type: "codeBlock",
			attrs: { language: "" },
			content: [{ type: "text", text: codeText }],
		};
	}

	taskListItem(taskListItems: Array<TaskItemElement>): TaskListItemElement {
		return {
			type: "taskList",
			content: taskListItems,
			attrs: { localId: "Task List" },
		};
		this.adf.push(taskList);
		return this;
	}

	textItem(text: string): TextElement {
		return {
			type: "text",
			text: text,
		};
	}

	strongItem(text: string): TextElement {
		return {
			type: "text",
			text: text,
			marks: [{ type: "strong" }],
		};
	}

	bulletListItem(listItems: Array<ListItemElement>): BulletListItemElement {
		return {
			type: "bulletList",
			content: listItems,
		};
	}

	orderedListItem(listItems: Array<ListItemElement>): OrderedListElement {
		return {
			type: "orderedList",
			content: listItems,
		};
	}

	linkItem(linkText: string, href: string): LinkElement {
		return {
			type: "text",
			text: linkText,
			marks: [{ type: "link", attrs: { href: href } }],
		};
	}

	blockquoteItem(blockquoteText: string): BlockquoteElement {
		return {
			type: "blockquote",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: blockquoteText }],
				},
			],
		};
	}

	emphasisItem(emText: string) {
		return {
			type: "text",
			text: emText,
			marks: [{ type: "em" }],
		};
	}

	listItem(text: string): ListItemElement {
		return {
			type: "listItem",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: text.trim(),
						},
					],
				},
			],
		};
	}

	taskItem(text: string, isChecked: boolean): TaskItemElement {
		return {
			type: "taskItem",
			attrs: { localId: text, state: isChecked ? "DONE" : "TODO" },
			content: [
				{
					type: "text",
					text: text,
					marks: [],
				},
			],
		};
	}

	addItem(item): this {
		this.adf.push(item);
		return this;
	}

	build(): AdfElement {
		return this.adf;
	}
}
