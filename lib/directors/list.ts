import ADFBuilder from "lib/builder/adf";
import ParagraphDirector from "./paragraph";
import {
	BulletListItemElement,
	OrderedListElement,
	TaskListItemElement,
} from "lib/builder/types";

class ListDirector extends ParagraphDirector {
	async addList(node: HTMLOListElement | HTMLUListElement, filePath: string) {
		this.builder.addItem(await this.buildList(node, filePath));
	}

	async buildList(
		node: HTMLOListElement | HTMLUListElement,
		filePath: string
	): Promise<
		BulletListItemElement | OrderedListElement | TaskListItemElement
	> {
		const isTaskList = this.isTasklist(node);
		let list = this.builder.bulletListItem([]);

		if (node.nodeName == "OL") {
			list = this.builder.orderedListItem([]);
		}

		if (isTaskList) {
			// @ts-ignore
			list = this.builder.taskListItem([]);
		}

		await this.buildListItems(node, isTaskList, filePath, list);

		return list;
	}

	async buildListItems(
		node: HTMLOListElement | HTMLUListElement,
		isTaskList: boolean,
		filePath: string,
		list: BulletListItemElement | OrderedListElement | TaskListItemElement
	) {
		const items = await Promise.all(
			Array.from(node.children).map(async (li) => {
				const itemsAdfBuilder = new ADFBuilder();
				const paragraphDirector = new ParagraphDirector(
					itemsAdfBuilder,
					this.fileAdaptor,
					this.app,
					this.client,
					this.settings,
					this.labelDirector
				);

				if (isTaskList) {
					return this.builder.taskItem(
						li.textContent?.trim()!,
						Boolean(li.getAttr("data-task"))
					);
				}

				let p = createEl("p");
				let subList = null;

				for (const child of Array.from(li.childNodes)) {
					if (
						child.nodeType === Node.ELEMENT_NODE &&
						["OL", "UL"].includes(child.nodeName)
					) {
						subList = await this.buildList(
							child as HTMLOListElement | HTMLUListElement,
							filePath
						);
					} else {
						if (child.textContent == "\n") {
							continue;
						}

						if (
							child.nodeType == Node.ELEMENT_NODE &&
							child.nodeName == "P"
						) {
							p = child as HTMLParagraphElement;
							continue;
						}

						p.append(child);
					}
				}

				await paragraphDirector.addItems(p, filePath);
				const listItem = this.builder.listItem(itemsAdfBuilder.build());

				if (subList) {
					listItem.content.push(subList);
				}

				return listItem;
			})
		);

		if (items) {
			// @ts-ignore
			list.content.push(...items);
		}
	}

	isTasklist(node: HTMLOListElement | HTMLUListElement): boolean {
		return (
			node.querySelectorAll("li").length ===
			node.querySelectorAll('input[type="checkbox"]').length
		);
	}
}

export default ListDirector;
