import { Client, PageResponse, GetPagesResponse, RequestConfig } from "./types";
import { CreatePage, UpdatePage, GetPageById } from "./parameters";

export class Page {
	constructor(private client: Client) {}

	async createPage(parameters: CreatePage): Promise<PageResponse> {
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

		if (parameters.adf) {
			const adf_body = {
				version: 1,
				type: "doc",
				content: parameters.adf,
			};

			config.params = {
				...config.params,
				body: {
					representation: "atlas_doc_format",
					value: JSON.stringify(adf_body),
				},
			};
		}

		return await this.client.sendRequest(config);
	}

	async updatePage(parameters: UpdatePage): Promise<PageResponse> {
		const pageResponse = await this.getPageById({
			pageId: parameters.pageId,
		});

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
			},
		};

		if (parameters.adf) {
			const adf_body = {
				version: 1,
				type: "doc",
				content: parameters.adf,
			};

			config.params = {
				...config.params,
				body: {
					representation: "atlas_doc_format",
					value: JSON.stringify(adf_body),
				},
			};
		}

		return await this.client.sendRequest(config);
	}

	async getPageById(parameters: GetPageById): Promise<PageResponse> {
		const config: RequestConfig = {
			url: `api/v2/pages/${parameters.pageId}`,
			method: "GET",
		};

		return await this.client.sendRequest(config);
	}

	async getPages(): Promise<GetPagesResponse> {
		const config: RequestConfig = {
			url: "api/v2/pages",
			method: "GET",
		};

		return await this.client.sendRequest(config);
	}
}
