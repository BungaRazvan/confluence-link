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

	addHeading(level: number, text: string): this {
		const heading: HeadingElement = {
			type: "heading",
			content: [{ type: "text", text: text }],
			attrs: { level: level },
		};
		this.adf.push(heading);
		return this;
	}

	addHorizontalRule(): this {
		this.adf.push({
			type: "rule",
		});
		return this;
	}

	addParagraph(text?: string): this {
		const paragraph: ParagraphElement = {
			type: "paragraph",
			content: text ? [{ type: "text", text: text }] : [],
		};
		this.adf.push(paragraph);
		return this;
	}

	addTable(tableContent: Array<TableRowElement>): this {
		const table: TableElement = {
			type: "table",
			content: tableContent,
		};
		this.adf.push(table);
		return this;
	}

	addTableRow(cells: string[]): TableRowElement {
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

	addCodeBlock(codeText: string): this {
		const codeBlock: CodeBlockElement = {
			type: "codeBlock",
			attrs: { language: "" },
			content: [{ type: "text", text: codeText }],
		};
		this.adf.push(codeBlock);
		return this;
	}

	addTaskList(taskListItems: Array<TaskItemElement>): this {
		const taskList: TaskListItemElement = {
			type: "taskList",
			content: taskListItems,
			attrs: { localId: "Task List" },
		};
		this.adf.push(taskList);
		return this;
	}

	addStrong(text: string): this {
		const strongText: TextElement = {
			type: "text",
			text: text,
			marks: [{ type: "strong" }],
		};
		const paragraph: ParagraphElement = {
			type: "paragraph",
			content: [strongText],
		};
		this.adf.push(paragraph);
		return this;
	}

	addBulletList(listItems: Array<ListItemElement>): this {
		const bulletList: BulletListItemElement = {
			type: "bulletList",
			content: listItems,
		};
		this.adf.push(bulletList);
		return this;
	}

	addOrderedList(listItems: Array<ListItemElement>): this {
		const orderedList: OrderedListElement = {
			type: "orderedList",
			content: listItems,
		};
		this.adf.push(orderedList);
		return this;
	}

	addLink(linkText: string, href: string): this {
		const link: LinkElement = {
			type: "text",
			text: linkText,
			marks: [{ type: "link", attrs: { href: href } }],
		};
		this.adf.push(link);
		return this;
	}

	addBlockquote(blockquoteText: string): this {
		const blockquote: BlockquoteElement = {
			type: "blockquote",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: blockquoteText }],
				},
			],
		};
		this.adf.push(blockquote);
		return this;
	}

	addEmphasis(emText: string): this {
		this.adf.push({
			type: "text",
			text: emText,
			marks: [{ type: "em" }],
		});
		return this;
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

	build(): AdfElement {
		return this.adf;
	}
}
