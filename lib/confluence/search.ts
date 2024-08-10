import { Client, RequestConfig, SearchResponse } from "./types";
import { SearchByCQL } from "./parameters";

export default class Search {
	constructor(private client: Client) {}

	async searchByCQL(parameters: SearchByCQL): Promise<SearchResponse> {
		const config: RequestConfig = {
			url: "rest/api/search",
			method: "GET",
			params: {
				cql: parameters.cql,
				cqlcontext: parameters.cqlcontext,
				cursor: parameters.cursor,
				next: parameters.next,
				prev: parameters.prev,
				limit: parameters.limit,
				start: parameters.start,
				includeArchivedSpaces: parameters.includeArchivedSpaces,
				excludeCurrentSpaces: parameters.excludeCurrentSpaces,
				excerpt: parameters.excerpt,
				sitePermissionTypeFilter: parameters.sitePermissionTypeFilter,
				expand: parameters.expand,
			},
		};

		return await this.client.sendRequest(config);
	}
}
