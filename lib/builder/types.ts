export type LinkMarkElement = {
	type: "link";
	attrs: {
		href: string;
	};
};

export type CodeMarkElement = {
	type: "code";
};

export type StrongMarkElement = {
	type: "strong";
};

export type UnderlineMarkElement = {
	type: "underline";
};

export type StrikeMarkElement = {
	type: "strike";
};

export type EmMarkElement = {
	type: "em";
};

export type MarksList = (
	| LinkMarkElement
	| CodeMarkElement
	| StrongMarkElement
	| UnderlineMarkElement
	| StrikeMarkElement
	| EmMarkElement
)[];

export interface MarkElement {
	marks?: MarksList;
}

export interface TextElement extends MarkElement {
	type: string;
	text: string;
}

export interface MarkedElement extends TextElement {
	mark: MarksList;
}

export interface LinkElement {
	type: string;
	text: string;
	marks: LinkMarkElement[];
}

export interface CardElementLink {
	type: string;
	attrs: {
		url: string;
	};
}

export interface ParagraphElement {
	type: string;
	content: (TextElement | LinkElement | EmphasisElement | CardElementLink)[];
}
export interface EmphasisElement {
	type: "text";
	text: string;
	marks: [EmMarkElement];
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

export type AdfElement =
	| HeadingElement
	| ParagraphElement
	| TableElement
	| CodeBlockElement
	| TextElement
	| TaskListItemElement
	| ListItemElement
	| LinkElement
	| BlockquoteElement
	| RuleElement
	| EmphasisElement;
