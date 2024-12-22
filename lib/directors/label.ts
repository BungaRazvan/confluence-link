import PropertiesAdaptor from "lib/adaptors/properties";
import ConfluenceClient from "lib/confluence/client";
import { cloneDeep, isEmpty } from "lodash";
import { App, TFile } from "obsidian";

export default class LabelDirector {
	allTags: Array<string>;

	constructor(
		private readonly client: ConfluenceClient,
		private readonly propertiesAdaptor: PropertiesAdaptor
	) {
		this.allTags = propertiesAdaptor.properties.tags
			? cloneDeep(propertiesAdaptor.properties.tags)
			: [];
	}

	async addTags(htmlTags: Array<HTMLAnchorElement> = []) {
		for (const tag of htmlTags) {
			if (!this.allTags.includes(tag.textContent!)) {
				this.allTags.push(tag.textContent!);
			}
		}
	}

	async updateConfluencePage() {
		await this.client.label.addLabel(
			this.propertiesAdaptor.properties.pageId!,
			this.allTags
		);
	}
}
