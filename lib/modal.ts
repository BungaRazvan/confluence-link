import { App, FuzzySuggestModal, setIcon } from "obsidian";
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

	// @ts-ignore
	async getSuggestions(query: string) {
		if (!query.startsWith("??")) {
			return super.getSuggestions(query);
		}

		const searchQ = query.replaceAll("??", "").trim();

		if (!searchQ) {
			return [];
		}

		const fuzzySpacesSearch = await this.client.search.searchByCQL({
			cql: `space.title~'${searchQ}' and type = 'space'`,
		});
		const spaceKeys = map(fuzzySpacesSearch.results, "space.key");

		if (spaceKeys.length == 0) {
			return [];
		}

		const spacesResponse = await this.client.space.getSpacesByKeys(
			spaceKeys
		);

		const spaces = map(spacesResponse.results, (item) => {
			return {
				item: {
					title: item.name,
					id: item.id,
				},
			};
		});

		return spaces;
	}

	render(): void {
		this.resultContainerEl.empty();

		for (const space of this.spaces) {
			const div = createDiv("suggestion-item");

			const icon = createSpan();
			setIcon(icon, "star");

			const span = createSpan();
			span.textContent = this.getItemText(space);
			div.appendChild(span);
			div.appendChild(icon);

			div.addEventListener("mouseenter", () => {
				div.classList.add("is-selected");
			});

			div.addEventListener("mouseleave", () => {
				div.classList.remove("is-selected");
			});

			div.addEventListener("click", () => {
				return;
				this.onChooseItem(space);
			});

			this.resultContainerEl.appendChild(div);
		}
	}
}
