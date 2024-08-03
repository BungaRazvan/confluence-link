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
	EmphasisElement,
	LinkMarkElement,
	StrikeMarkElement,
	UnderlineMarkElement,
	CodeMarkElement,
	EmMarkElement,
	StrongMarkElement,
	CardElementLink,
	MediaSingleItemElement,
	MediaItemElement,
	Layout,
} from "./types";

export default class ADFBuilder {
	private adf: AdfElement[];

	constructor() {
		this.adf = [];
	}

	headingItem(level: number, text: string): HeadingElement {
		const heading = {
			type: "heading",
			content: [{ type: "text", text: text }],
			attrs: { level: level, id: text },
		};
		return heading;
	}

	horizontalRuleItem(): { type: "rule" } {
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

	codeItem(codeText: string): TextElement {
		return {
			type: "text",
			text: codeText,
			marks: [this.markCode()],
		};
	}

	underlineItem(text: string): TextElement {
		return {
			type: "text",
			text: text,
			marks: [this.markUnderline()],
		};
	}

	strikeItem(text: string): TextElement {
		return {
			type: "text",
			text: text,
			marks: [this.markStrike()],
		};
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
			marks: [this.markStrong()],
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
			marks: [this.markLink(href)],
		};
	}

	cardItem(href: string): CardElementLink {
		return {
			type: "inlineCard",
			attrs: {
				url: href,
			},
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

	emphasisItem(emText: string): EmphasisElement {
		return {
			type: "text",
			text: emText,
			marks: [this.markEm()],
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

	mediaItem(id: string, collection: string): MediaItemElement {
		return {
			type: "media",
			attrs: {
				type: "file",
				id,
				collection,
			},
		};
	}

	mediaSingleItem(
		id: string,
		collection: string,
		layout: Layout = "center"
	): MediaSingleItemElement {
		return {
			type: "mediaSingle",
			content: [this.mediaItem(id, collection)],
			attrs: {
				layout,
			},
		};
	}

	labelItem() {
		return {
			type: "inlineExtension",
			attrs: {
				extensionKey: "custom-tag",
				parameters: {
					tags: ["example", "tag1", "tag2"],
				},
			},
		};
	}

	markLink(href: string): LinkMarkElement {
		return {
			type: "link",
			attrs: {
				href,
			},
		};
	}

	markStrong(): StrongMarkElement {
		return { type: "strong" };
	}

	markEm(): EmMarkElement {
		return { type: "em" };
	}

	markCode(): CodeMarkElement {
		return { type: "code" };
	}

	markUnderline(): UnderlineMarkElement {
		return {
			type: "underline",
		};
	}

	markStrike(): StrikeMarkElement {
		return {
			type: "strike",
		};
	}

	addItem(item: AdfElement): this {
		this.adf.push(item);
		return this;
	}

	build(): AdfElement[] {
		return this.adf;
	}
}
