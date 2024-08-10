import { Client, RequestConfig } from "./types";
import { map } from "lodash";

export default class Label {
	constructor(private client: Client) {}

	async addLabel(pageId: string, labels: Array<string>) {
		const labelObjects = map(labels, (label) => {
			return { prefix: "global", name: label.replaceAll("#", "") };
		});
		const config: RequestConfig = {
			url: `rest/api/content/${pageId}/label`,
			method: "POST",
			params: labelObjects,
		};

		return await this.client.sendRequest(config);
	}
}
