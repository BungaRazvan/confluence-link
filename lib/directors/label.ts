import PropertiesAdaptor from "lib/adaptors/properties";
import ConfluenceClient from "lib/confluence/client";
import { isEmpty } from "lodash";
import { App, TFile } from "obsidian";

export default class LabelDirector {
	constructor(
		private readonly app: App,
		private readonly client: ConfluenceClient
	) {}

	async addTags(
		filePath: string,
		uploadTags: boolean,
		htmlTags: Array<HTMLAnchorElement> = []
	) {
		if (!uploadTags) {
			return null;
		}

		const file = this.app.metadataCache.getFirstLinkpathDest(filePath, ".");

		if (!(file instanceof TFile)) {
			return null;
		}

		let allTags: Array<string> = [];
		const fileData = await this.app.vault.read(file);
		const propAdaptor = new PropertiesAdaptor().loadProperties(fileData);
		const { pageId, tags } = propAdaptor.properties;

		if (!isEmpty(tags)) {
			allTags = tags!;
		}

		for (const tag of htmlTags) {
			allTags.push(tag.textContent!);
		}

		if (allTags.length == 0) {
			return null;
		}

		await this.client.label.addLabel(pageId!, allTags);
		return;
	}
}
