import FileAdaptor from "lib/adaptors/file";
import ADFBuilder from "lib/builder/adf";

class LinkDirector {
	constructor(
		private readonly builder: ADFBuilder,
		private readonly fileAdaptor: FileAdaptor
	) {}

	async build_item(
		node: HTMLAnchorElement,
		followLinks: boolean,
		filePath: string
	) {
		const classList = node.classList;
		const isExternalLink = classList.contains("external-link");
		const linkPath = node.getAttr("href")!;

		if (!followLinks) {
			if (isExternalLink) {
				if (node.getAttr("data-tooltip-position")) {
					return this.builder.cardItem(linkPath);
				}

				return this.builder.linkItem(node.textContent!, linkPath);
			}

			const paths = linkPath
				.split("#")
				.filter((string) => string.trim() != "");
			const samePageLink = paths.length == 1;

			// check if we are linking to the same file
			if (
				linkPath.includes(filePath.replace(".md", "")) ||
				(samePageLink && linkPath.includes("#"))
			) {
				const href = await this.findLink(node);
				return this.builder.cardItem(href);
			}

			return this.builder.linkItem(node.text, "#");
		}

		const href = await this.findLink(node);

		if (href == "#") {
			return this.builder.linkItem(node.textContent!, "#");
		}

		if (
			classList.contains("internal-link") ||
			(isExternalLink && node.getAttr("data-tooltip-position"))
		) {
			return this.builder.cardItem(href);
		}

		return this.builder.linkItem(node.textContent!, href);
	}

	async findLink(linkEl: HTMLAnchorElement): Promise<string> {
		let href = linkEl.href!;

		if (linkEl.classList.contains("internal-link")) {
			const dataLink = linkEl.getAttr("data-href")!;

			if (dataLink.contains("#")) {
				const paths = dataLink
					.split("#")
					.filter((string) => string.trim() != "");
				const newPageLink = paths.length > 1;

				if (newPageLink) {
					href =
						(await this.fileAdaptor.getConfluenceLink(
							paths[0] + ".md"
						)) +
						"#" +
						paths[1];

					href = href.replaceAll(" ", "-");
				} else {
					href = dataLink.replaceAll(" ", "-");
				}
			} else {
				href = await this.fileAdaptor.getConfluenceLink(
					linkEl.dataset.href! + ".md"
				);
			}
		}

		return href;
	}
}

export default LinkDirector;
