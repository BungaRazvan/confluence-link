import { difference, isEmpty } from "lodash";
import { stringify, parse } from "yaml";

export interface PropsType {
	tags?: Array<string>;
	pageId?: string;
	spaceId?: string;
	confluenceUrl?: string;
	[key: string]:
		| boolean
		| Array<string | number | Date | boolean>
		| number
		| string
		| Date
		| undefined;
}

export default class PropertiesAdaptor {
	properties: PropsType;

	constructor() {
		this.properties = {};
	}

	loadProperties(str: string): PropertiesAdaptor {
		const frontMatterMatch = str.match(/^---\n([\s\S]+?)\n---\n/);

		if (!frontMatterMatch || frontMatterMatch.length < 2) {
			return this;
		}

		const existingFrontMatter = frontMatterMatch[1]
			.trim()
			.replaceAll("}", "");
		// Parse the existing YAML front matter into an object
		const existingFrontMatterObject = parse(existingFrontMatter);

		if (existingFrontMatterObject) {
			this.properties = existingFrontMatterObject;
		}

		return this;
	}

	addProperties(props: PropsType): PropertiesAdaptor {
		this.properties = {
			...this.properties,
			...props,
		};

		return this;
	}

	addTags(tags: Array<string>): PropertiesAdaptor {
		const props = { ...this.properties };
		const propTags = props.tags;

		if (isEmpty(propTags)) {
			this.addProperties({ tags: tags });
			return this;
		}

		const newTags = difference(tags, propTags!);

		this.addProperties({ tags: propTags!.concat(newTags) });
		return this;
	}

	toFile(str: string): string {
		const frontMatterMatch = str.match(/^---\n([\s\S]+?)\n---\n/);

		if (isEmpty(this.properties)) {
			return "";
		}

		if (!frontMatterMatch) {
			return `---\n${stringify(this.properties)}\n---\n${str}`;
		}

		return str.replace(
			frontMatterMatch[0],
			`---\n${stringify(this.properties)}\n---\n`
		);
	}
}
