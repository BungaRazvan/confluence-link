import { Client, RequestConfig } from "./types";
import { SearchByCQL } from "./parameters";

export class Page {
	constructor(private client: Client) {}

	async createPage(parameters) {
		const config: RequestConfig = {
			url: "api/v2/pages",
			method: "POST",
			params: {
				spaceId: parameters.spaceId,
				status: "current",
				title: parameters.pageTitle,
				parentId: parameters.parentId,
			},
		};

		return await this.client.sendRequest(config);
	}

	async updatePage(parameters) {
		const config: RequestConfig = {
			url: `api/v2/pages/${parameters.pageId}`,
			method: "PUT",
			params: {
				id: parameters.pageId,
				status: "current",
				title: parameters.pageTitle,
				parentId: parameters.parentId,
				spaceId: parameters.spaceId,
				ownerId: parameters.ownerId,
			},
		};

		return await this.client.sendRequest(config);
	}

	async getPageById(parameters) {
		const config: RequestConfig = {
			url: `api/v2/pages/${parameters.pageId}`,
			method: "GET",
		};

		return await this.client.sendRequest(config);
	}
}
