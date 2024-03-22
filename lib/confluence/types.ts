export interface Obs2ConFluxSettings {
	confluenceDomain: string;
	atlassianUsername: string;
	atlassianApiToken: string;
	confluenceDefaultSpaceId: string;
}

export interface Config {
	host: string;
	authentication: {
		email: string;
		apiToken: string;
	};
}

export interface UrlConfig {
	url: string;
	method: "GET" | "POST" | "PUT" | "DELETE";
}

export interface RequestConfig extends UrlConfig {
	params?: object;
}

export interface ObsidianRequestParams extends UrlConfig {
	body?: string;
}

export interface Client {
	sendRequest<T>(requestConfig: RequestConfig): object | undefined;
}
