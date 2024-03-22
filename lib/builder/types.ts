export interface TextElement {
	type: string;
	text: string;
	marks?: { type: string }[];
}

export interface MarkElement {
	type: string;
}

export interface LinkMarkElement extends MarkElement {
	attrs: {
		href: string;
	};
}

export interface ParagraphElement {
	type: string;
	content: TextElement[];
}

export interface TableCellElement {
	type: string;
	attrs: {
		background: string;
		colwidth: any[];
		colspan: number;
		rowspan: number;
	};
	content: ParagraphElement[];
}

export interface TableRowElement {
	type: string;
	content: TableCellElement[];
}

export interface HeadingElement {
	type: string;
	content: TextElement[];
	attrs: {
		level: number;
	};
}

export interface RuleElement {
	type: string;
}

export interface TableElement {
	type: string;
	content: TableRowElement[];
}

export interface CodeBlockElement {
	type: string;
	attrs: {
		language: string;
	};
	content: TextElement[];
}

export interface TaskItemElement {
	type: string;
	attrs: {
		localId: string;
		state: "DONE" | "TODO";
	};
	content: TextElement[];
}

export interface TaskListItemElement {
	type: string;
	content: TaskItemElement[];
	attrs: {
		localId: string;
	};
}

export interface BulletListItemElement {
	type: string;
	content: ListItemElement[];
}

export interface OrderedListElement {
	type: string;
	content: ListItemElement[];
}

export interface LinkElement {
	type: string;
	text: string;
	marks: LinkMarkElement[];
}

export interface BlockquoteElement {
	type: string;
	content: ParagraphElement[];
}

export interface ADFNode {
	type: string;
	[key: string]: any;
}

export type ListItemElement = {
	type: "listItem";
	content: ParagraphElement[];
};
