import ParagraphDirector from "./paragraph";

class CodeDirector extends ParagraphDirector {
	async addItem(codeElement) {
		const codeText = codeElement.textContent || "";

		if (codeElement.classList.contains("language-mermaid")) {
			return;
		}
	}
}

export default CodeDirector;
