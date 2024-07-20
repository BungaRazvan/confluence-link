import { concatenateUint8Arrays, removeUndefinedProperties } from "lib/utils";
import { Client, RequestConfig, UploadResponse } from "./types";
import { requestUrl } from "obsidian";

export class Attachements {
	ATLASSIAN_TOKEN_CHECK_FLAG: string;
	ATLASSIAN_TOKEN_CHECK_NOCHECK_VALUE: string;

	constructor(private readonly client: Client) {
		this.ATLASSIAN_TOKEN_CHECK_FLAG = "X-Atlassian-Token";
		this.ATLASSIAN_TOKEN_CHECK_NOCHECK_VALUE = "no-check";
	}

	// async uploadPdf(): Promise<UploadResponse> {}

	async uploadImage(
		pageId: string,
		imageBinary: ArrayBuffer,
		imageName: string,
		imageExtension: string
	): Promise<UploadResponse> {
		const config: RequestConfig = {
			url: `rest/api/content/${pageId}/child/attachment`,
			method: "PUT",
			params: {
				minorEdit: true,
				imageName,
				imageExtension,
				imageBinary,
			},
		};

		return await this.sendRequest(config);
	}

	async sendRequest(requestConfig: RequestConfig): Promise<any> {
		const clientConfig = this.client.config;
		const params = removeUndefinedProperties(requestConfig.params || {});

		const creds = Buffer.from(
			`${clientConfig.authentication.email}:${clientConfig.authentication.apiToken}`
		).toString("base64");
		const url = new URL(`/wiki/${requestConfig.url}`, clientConfig.host);

		const boundary = `----WebKitFormBoundary${Math.random()
			.toString(36)
			.substring(7)}`;

		const imageBlob = new Blob([params.imageBinary], {
			type: `image/${params.imageExtension}`,
		});

		// Create the multipart form data manually
		const formDataParts = [];

		// Add file part
		formDataParts.push(
			`--${boundary}\r\n` +
				`Content-Disposition: form-data; name="file"; filename="${params.imageName}.${params.imageExtension}"\r\n` +
				`Content-Type: image/png\r\n\r\n`
		);
		formDataParts.push(new Uint8Array(await imageBlob.arrayBuffer()));
		formDataParts.push(`\r\n`);

		// Add minorEdit part
		formDataParts.push(
			`--${boundary}\r\n` +
				`Content-Disposition: form-data; name="minorEdit"\r\n\r\n` +
				`${params.minorEdit}\r\n`
		);

		// Add comment part
		formDataParts.push(
			`--${boundary}\r\n` +
				`Content-Disposition: form-data; name="comment"\r\n\r\n` +
				`Content uploaded using Obsidian\r\n`
		);

		// End boundary
		formDataParts.push(`--${boundary}--\r\n`);

		// Convert form data parts to Uint8Array
		const bodyArray = formDataParts.map((part) => {
			if (typeof part === "string") {
				return new TextEncoder().encode(part);
			} else {
				return new Uint8Array(part);
			}
		});

		// Concatenate all parts into a single Uint8Array
		const bodyUint8Array = concatenateUint8Arrays(bodyArray);

		const response = await requestUrl({
			url: url.toString(),
			method: requestConfig.method,
			body: bodyUint8Array.buffer,
			headers: {
				Accept: "application/json",
				"User-Agent": "Obsidian.md",
				Authorization: `Basic ${creds}`,
				[this.ATLASSIAN_TOKEN_CHECK_FLAG]:
					this.ATLASSIAN_TOKEN_CHECK_NOCHECK_VALUE,
				"Content-Type": `multipart/form-data; boundary=${boundary}`,
			},
			throw: false,
		});

		if (response.status >= 200 && response.status < 300) {
			// If the response status is okay, parse JSON
			return response.json;
		} else {
			console.error(response.json);
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
	}
}
