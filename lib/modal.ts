import { App, FuzzySuggestModal } from "obsidian";
import { map } from "lodash";

import ConfluenceClient from "./confluence/client";

interface Space {
	title: string;
	id: string;
}

type Callback = (resilts: Space) => void;

export default class SpaceSearchModal extends FuzzySuggestModal<Space> {
	client: ConfluenceClient;
	spaces: Space[];
	callback: Callback;

	constructor(app: App, client: ConfluenceClient, callback: Callback) {
		super(app);
		this.client = client;
		this.callback = callback;
		this.spaces = [];
	}

	async onOpen(): Promise<void> {
		const resp = await this.client.space.getSpaces();
		const spaces = map(resp.results, (item) => {
			return {
				title: item.name,
				id: item.id,
			};
		});

		this.spaces = spaces;
		this.render();
	}

	getItems(): Space[] {
		return this.spaces;
	}

	getItemText(space: Space): string {
		return space.title;
	}

	onChooseItem(space: Space): void {
		this.callback(space);
		this.close();
	}

	render(): void {
		this.resultContainerEl.empty();

		for (const space of this.spaces) {
			const div = createDiv("suggestion-item");
			div.textContent = this.getItemText(space);

			div.addEventListener("mouseenter", () => {
				div.classList.add("is-selected");
			});

			div.addEventListener("mouseleave", () => {
				div.classList.remove("is-selected");
			});

			div.addEventListener("click", () => {
				this.onChooseItem(space);
			});

			this.resultContainerEl.appendChild(div);
		}
	}
}
