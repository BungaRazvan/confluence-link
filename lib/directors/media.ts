import { App, TFile } from "obsidian";

import ADFBuilder from "lib/builder/adf";
import PropertiesAdaptor from "lib/adaptors/properties";
import ConfluenceClient from "lib/confluence/client";
import { toBlob } from "html-to-image";
import { Layout } from "lib/builder/types";
import { wait } from "lib/utils";

class MediaDirector {
	constructor(
		private readonly builder: ADFBuilder,
		private readonly app: App,
		private readonly client: ConfluenceClient
	) {}

	async build_item(node: HTMLSpanElement, filePath: string) {
		const modEmpty = node.classList.contains("mod-empty-attachment");

		if (modEmpty) {
			return null;
		}

		const file = this.app.metadataCache.getFirstLinkpathDest(filePath, ".");

		if (!(file instanceof TFile)) {
			return null;
		}

		const src = node.getAttr("src")!;

		const canvasEmbed = node.classList.contains("canvas-embed");
		const imageEmbed = node.classList.contains("image-embed");
		const pdfEmbed = node.classList.contains("pdf-embed");
		const videoEmbed = node.classList.contains("video-embed");

		const formData = new FormData();
		const fileData = await this.app.vault.read(file);
		const props = new PropertiesAdaptor().loadProperties(fileData);
		const pageId = props.properties.pageId;

		let width = null;
		let height = null;
		let layout: Layout = "center";

		if (canvasEmbed) {
			// TODO figure out canvas
			return null;
		} else if (imageEmbed) {
			const wrap = node.getAttr("alt");

			width = node.getAttr("width")
				? parseInt(node.getAttr("width")!)
				: null;
			height = node.getAttr("height")
				? parseInt(node.getAttr("height")!)
				: null;
			layout =
				wrap == "inL"
					? "wrap-left"
					: wrap == "inR"
					? "wrap-right"
					: "center";

			const imgFile = this.app.metadataCache.getFirstLinkpathDest(
				src,
				"."
			);

			if (!imgFile) {
				console.error("not know path", node);
				return null;
			}

			formData.append(
				"file",
				new File(
					[await this.app.vault.readBinary(imgFile)],
					imgFile.name
				)
			);
		} else if (pdfEmbed || videoEmbed) {
			const fileSrc = src.split("#")[0];
			const fileEmbed = this.app.metadataCache.getFirstLinkpathDest(
				fileSrc,
				"."
			);

			if (!fileEmbed) {
				console.error("not know path", node);
				return null;
			}

			formData.append(
				"file",
				new File(
					[await this.app.vault.readBinary(fileEmbed)],
					fileEmbed.name
				)
			);
		}

		const attachmentResponse = await this.client.attachement.uploadFile(
			pageId as string,
			formData
		);
		const { extensions } = attachmentResponse!.results[0];

		return this.builder.mediaSingleItem(
			extensions.fileId,
			extensions.collectionName,
			layout,
			width,
			height
		);
	}
}

export default MediaDirector;
