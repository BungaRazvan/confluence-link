import { App, FuzzyMatch, FuzzySuggestModal, setIcon } from "obsidian";
import { map, filter } from "lodash";

import ConfluenceClient from "./confluence/client";
import ConfluenceLink from "main";

interface Space {
	title: string;
	id: string;
	key: string;
}

type Callback = (resilts: Space) => void;

export default class SpaceSearchModal extends FuzzySuggestModal<Space> {
	client: ConfluenceClient;
	spaces: Space[];
	plugin: ConfluenceLink;
	callback: Callback;

	constructor(
		app: App,
		plugin: ConfluenceLink,
		client: ConfluenceClient,
		callback: Callback
	) {
		super(app);
		this.client = client;
		this.plugin = plugin;
		this.callback = callback;
		this.spaces = [];
	}

	async onOpen(): Promise<void> {
		const favSpaces = this.plugin.settings.favSpaces;
		const spaces: Space[] = [];

		if (favSpaces.length) {
			const favSpacesResponse = await this.client.space.getSpacesByKeys(
				favSpaces
			);

			map(favSpacesResponse.results, (item) => {
				spaces.push({
					title: item.name,
					id: item.id,
					key: item.key,
				});
			});
		}

		const resp = await this.client.space.getSpaces();
		const nonFavSpaces = map(
			filter(resp.results, (item) => !favSpaces.includes(item.key)),
			(item) => {
				return {
					title: item.name,
					id: item.id,
					key: item.key,
				};
			}
		);

		this.spaces = [...spaces, ...nonFavSpaces];
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
					key: item.key,
				},
			};
		});

		return spaces;
	}

	renderSuggestion(item: FuzzyMatch<Space>, el: HTMLElement) {
		const { item: space } = item;

		const favSpaces = this.plugin.settings.favSpaces;
		const div = createDiv("suggestion-item space-container");
		const icon = createSpan();
		setIcon(icon, "star");
		icon.classList.add("fav-icon");

		if (favSpaces.includes(space.key)) {
			icon.classList.add("is-fav");
		}

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

		div.addEventListener("click", (e) => {
			if (e.targetNode instanceof SVGElement) {
				e.stopPropagation();
				icon.classList.toggle("is-fav");

				if (icon.classList.contains("is-fav")) {
					favSpaces.push(space.key);
				} else {
					const spaceIdx = favSpaces.indexOf(space.key);
					favSpaces.splice(spaceIdx, 1);
				}

				this.plugin.saveSettings();
				return;
			}

			this.onChooseItem(space);
		});

		if (el.classList.contains("suggestion-item")) {
			el.replaceWith(div);
		} else {
			el.appendChild(div);
		}
	}

	render(): void {
		this.resultContainerEl.empty();

		for (const space of this.spaces) {
			this.renderSuggestion(
				{ item: space, match: { score: 0, matches: [] } },
				this.resultContainerEl
			);
		}
	}
}
