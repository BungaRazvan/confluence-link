import { Client, RequestConfig } from "./types";

export class Space {
	constructor(private client: Client) {}

	async getSpaces(): Promise<object> {
		const config: RequestConfig = {
			url: "api/v2/spaces",
			method: "GET",
		};

		return (await this.client.sendRequest(config)) as object;
	}
}
