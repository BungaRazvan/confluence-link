import { Client, RequestConfig, SpaceResponse } from "./types";

export default class Space {
	constructor(private client: Client) {}

	async getSpaces(limit: number = 250): Promise<SpaceResponse> {
		const config: RequestConfig = {
			url: "api/v2/spaces",
			method: "GET",
			params: {
				limit,
			},
		};

		return await this.client.sendRequest(config);
	}

	async getSpacesByKeys(keys: string[] | string): Promise<SpaceResponse> {
		const config: RequestConfig = {
			url: "api/v2/spaces",
			method: "GET",
			params: {
				limit: 250,
				keys,
			},
		};

		return await this.client.sendRequest(config);
	}
}
