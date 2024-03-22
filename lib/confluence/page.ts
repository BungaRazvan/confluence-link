import { Client, RequestConfig } from "./types";
import { CreatePage, UpdatePage, GetPageById } from "./parameters";

export class Page {
	constructor(private client: Client) {}

	async createPage(parameters: CreatePage) {
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

	async updatePage(parameters: UpdatePage) {
		const pageResponse = await this.getPageById({
			pageId: parameters.pageId,
		});

		let adf_body = {
			version: 1,
			type: "doc",
			content: parameters.adf,
		};

		console.log(adf_body);

		console.log(adf_body);
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
				version: {
					number: pageResponse.version.number + 1,
					message: `Obsidian update ${new Date().toISOString()}`,
				},
				body: {
					representation: "atlas_doc_format",
					value: JSON.stringify(adf_body),
				},
			},
		};

		// console.log("here", config);
		return await this.client.sendRequest(config);
	}

	async getPageById(parameters: GetPageById) {
		const config: RequestConfig = {
			url: `api/v2/pages/${parameters.pageId}`,
			method: "GET",
		};

		return await this.client.sendRequest(config);
	}

	async getPages() {
		const config: RequestConfig = {
			url: "api/v2/pages",
			method: "GET",
		};

		return await this.client.sendRequest(config);
	}
}
