import FileAdaptor from "lib/adaptors/file";
import ADFBuilder from "lib/builder/adf";

class LinkDirector {
	constructor(
		private readonly builder: ADFBuilder,
		private readonly fileAdaptor: FileAdaptor
	) {}

	async build_item(node: HTMLAnchorElement, followLinks: boolean) {
		const classList = node.classList;

		if (classList.contains("tab")) {
			return null;
		}

		if (!followLinks) {
			return null;
		}

		const href = await this.findLink(node);

		if (
			classList.contains("internal-link") &&
			node.getAttr("href") == node.getAttr("data-href")
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
				const paths = dataLink.split("#");
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
