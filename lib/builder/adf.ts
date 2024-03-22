interface TextElement {
	type: string;
	text: string;
	marks?: [{ type: string }];
}

interface MarkElement {
	type: string;
}

interface LinkMarkElement extends MarkElement {
	attrs: {
		href: string;
	};
}

interface ParagraphElement {
	type: string;
	content: TextElement[];
}

interface TableCellElement {
	type: string;
	attrs: {
		background: string;
		colwidth: any[];
		colspan: number;
		rowspan: number;
	};
	content: ParagraphElement[];
}

interface TableRowElement {
	type: string;
	content: TableCellElement[];
}

interface HeadingElement {
	type: string;
	content: TextElement[];
	attrs: {
		level: number;
	};
}

interface TableElement {
	type: string;
	content: TableRowElement[];
}

interface CodeBlockElement {
	type: string;
	attrs: {
		language: string;
	};
	content: TextElement[];
}

interface TaskListItemElement {
	type: string;
	content: ParagraphElement[];
	attrs: {
		localId: string;
		state: string;
	};
}

interface BulletListItemElement {
	type: string;
	content: ParagraphElement[];
}

interface OrderedListElement {
	type: string;
	content: ListItemElement[];
}

interface LinkElement {
	type: string;
	text: string;
	marks: LinkMarkElement[];
}

interface BlockquoteElement {
	type: string;
	content: ParagraphElement[];
}

interface ADFNode {
	type: string;
	[key: string]: any;
}

type ListItemElement = BulletListItemElement | OrderedListElement;

export default class ADFBuilder {
	private adf: Array<
		| HeadingElement
		| ParagraphElement
		| TableElement
		| CodeBlockElement
		| TextElement
		| TaskListItemElement
		| ListItemElement
		| LinkElement
		| BlockquoteElement
	>;

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

	addTableRow(cells: string[]): this {
		const tableRow: TableRowElement = {
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
		this.adf.push(tableRow);
		return this;
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

	addTaskList(taskListItems: Array<TaskListItemElement>): this {
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

	addBulletList(listItems: Array<BulletListItemElement>): this {
		const bulletList: BulletListItemElement = {
			type: "bulletList",
			content: listItems,
		};
		this.adf.push(bulletList);
		return this;
	}

	addOrderedList(listItems: Array<OrderedListElement>): this {
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

	addContent(content: ADFNode | ADFNode[]): this {
		if (Array.isArray(content)) {
			this.adf.push(...content);
		} else {
			this.adf.push(content);
		}
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

	addEmphasis(emText: string) {
		this.adf.push({
			type: "text",
			text: emText,
			marks: [{ type: "em" }],
		});
		return this;
	}

	listItem(text: string, checkboxType) {
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
			attrs: { state: isChecked ? "DONE" : "TODO" },
		};
	}

	checkboxItem(text: string, isChecked: boolean) {
		return {
			type: "taskItem",
			attrs: { localId: "Task 1", state: isChecked ? "DONE" : "TODO" },
			content: [
				{
					type: "text",
					text: text,
					marks: [],
				},
			],
		};
	}

	build(): Array<
		| HeadingElement
		| ParagraphElement
		| TableElement
		| CodeBlockElement
		| TextElement
		| TaskListItemElement
		| ListItemElement
		| LinkElement
		| BlockquoteElement
	> {
		return this.adf;
	}
}
