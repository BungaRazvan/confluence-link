import ParagraphDirector from "./paragraph";

class TableDirector extends ParagraphDirector {
	async addItems(
		node: HTMLTableCellElement,
		filePath: string
	): Promise<void> {
		if (node.children.length == 0) {
			this.builder.addItem(this.builder.paragraphItem(node.textContent!));
			return;
		}

		const p = createEl("p");

		for (const cellNode of Array.from(node.childNodes)) {
			if (cellNode.nodeName == "BR") {
				await super.addItems(p, filePath, true);
				p.empty();
				continue;
			}

			p.appendChild(cellNode);
		}

		if (p.children.length > 0) {
			await super.addItems(p, filePath, true);
		}
	}
}

export default TableDirector;
