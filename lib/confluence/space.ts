import { Client, RequestConfig, SpaceResponse } from "./types";

export class Space {
	constructor(private client: Client) {}

	async getSpaces(): Promise<SpaceResponse> {
		const config: RequestConfig = {
			url: "api/v2/spaces",
			method: "GET",
		};

		return await this.client.sendRequest(config);
	}
}
