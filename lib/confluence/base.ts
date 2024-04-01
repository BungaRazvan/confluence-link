import { Notice, request, requestUrl } from "obsidian";
import { map, isEmpty, pickBy, compact } from "lodash";
import { Config, RequestConfig, ObsidianRequestParams } from "./types";

export default class BaseClient {
	constructor(protected readonly config: Config) {
		this.config = config;
	}

	protected removeUndefinedProperties(
		obj: Record<string, any>
	): Record<string, any> {
		return pickBy(obj, (value) => typeof value !== "undefined");
	}

	protected paramSerializer(parameters: Record<string, any>): string {
		return compact(
			map(parameters, (value, key) => {
				if (value === null || typeof value === "undefined") {
					return null;
				}

				if (Array.isArray(value)) {
					value = value.join(",");
				}

				if (value instanceof Date) {
					value = value.toISOString();
				} else if (value !== null && typeof value === "object") {
					value = JSON.stringify(value);
				} else if (value instanceof Function) {
					const part = value();
					return part && this.encode(part);
				}

				return `${this.encode(key)}=${this.encode(value)}`;
			})
		).join("&");
	}

	protected encode(value: string) {
		return encodeURIComponent(value)
			.replace(/%3A/gi, ":")
			.replace(/%24/g, "$")
			.replace(/%2C/gi, ",")
			.replace(/%20/g, "+")
			.replace(/%5B/gi, "[")
			.replace(/%5D/gi, "]");
	}

	async sendRequest(requestConfig: RequestConfig) {
		const creds = btoa(
			`${this.config.authentication.email}:${this.config.authentication.apiToken}`
		);
		const method = requestConfig.method;
		const url = new URL(`/wiki/${requestConfig.url}`, this.config.host);
		const params = this.removeUndefinedProperties(
			requestConfig.params || {}
		);
		const requestParams: ObsidianRequestParams = {
			url: url.toString(),
			method,
		};

		if (!isEmpty(params)) {
			if (method != "GET") {
				requestParams["body"] = JSON.stringify(params);
			} else {
				requestParams["url"] += `?${this.paramSerializer(params)}`;
			}
		}

		const response = await requestUrl({
			...requestParams,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${creds}`,
			},
			throw: false,
		});

		if (response.status >= 200 && response.status < 300) {
			// If the response status is okay, parse JSON
			return response.json;
		} else {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
	}
}
