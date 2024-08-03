import { App, TFile } from "obsidian";

import ADFBuilder from "lib/builder/adf";
import PropertiesAdaptor from "lib/adaptors/properties";
import ConfluenceClient from "lib/confluence/client";

class MediaDirector {
	constructor(
		private readonly builder: ADFBuilder,
		private readonly app: App,
		private readonly client: ConfluenceClient
	) {}

	async build_item(node: HTMLSpanElement, filePath: string) {
		const modEmpty = node.classList.contains("mod-empty-attachment");
		console.log(modEmpty, node);

		if (modEmpty) {
			return null;
		}

		const file = this.app.metadataCache.getFirstLinkpathDest(filePath, ".");

		if (!(file instanceof TFile)) {
			return null;
		}

		const canvasEmbed = node.classList.contains("canvas-embed");

		// TODO figure out canvas
		if (canvasEmbed) {
			return null;
		}

		const imageEmbed = node.classList.contains("image-embed");
		const pdfEmbed = node.classList.contains("pdf-embed");
		const videoEmbed = node.classList.contains("video-embed");

		const formData = new FormData();
		const fileData = await this.app.vault.read(file);
		const props = new PropertiesAdaptor().loadProperties(fileData);
		const pageId = props.properties.pageId;
		const src = node.getAttr("src")!;

		if (imageEmbed) {
			const imgFile = this.app.metadataCache.getFirstLinkpathDest(
				src,
				"."
			);

			if (!imgFile) {
				console.error("not know path", node);
				return null;
			}

			const fileData = new File(
				[await this.app.vault.readBinary(imgFile)],
				imgFile.name
			);

			formData.append("file", fileData);
		} else if (pdfEmbed || videoEmbed) {
			const fileEmbed = this.app.metadataCache.getFirstLinkpathDest(
				src,
				"."
			);

			if (!fileEmbed) {
				console.error("not know path", node);
				return null;
			}

			const fileData = new File(
				[await this.app.vault.readBinary(fileEmbed)],
				fileEmbed.name
			);

			formData.append("file", fileData);
		}

		const attachmentResponse = await this.client.attachement.uploadFile(
			pageId as string,
			formData
		);
		const { extensions } = attachmentResponse!.results[0];
		return this.builder.mediaSingleItem(
			extensions.fileId,
			extensions.collectionName
		);
	}
}

export default MediaDirector;
