import { load, JSON_SCHEMA } from "js-yaml";
import { map, isArray, isDate, isEmpty } from "lodash";

export interface PropsType {
	tags?: string | boolean | Array<string | boolean>;
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

		const existingFrontMatter = frontMatterMatch[1].trim();
		// Parse the existing YAML front matter into an object
		const existingFrontMatterObject = load(existingFrontMatter, {
			schema: JSON_SCHEMA,
		}) as { [key: string]: any };

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

	toFile(str: string): string {
		const frontMatterMatch = str.match(/^---\n([\s\S]+?)\n---\n/);

		if (isEmpty(this.properties)) {
			return;
		}

		if (!frontMatterMatch) {
			return `---\n${this.serializeProperties()}\n---\n${str}`;
		}

		return str.replace(
			frontMatterMatch[0],
			`---\n${this.serializeProperties()}\n---\n`
		);
	}

	private serializeProperties(): string {
		return map(this.properties, (value, key) => {
			if (value === undefined) {
				return "\n";
			} else if (key == "tags") {
				if (isArray(value)) {
					return `tags:\n${map(
						value,
						(item) => ` - \"${item}\"`
					).join("\n")}`;
				} else {
					return `tags:\n - \"${value}\"`;
				}
			} else if (isArray(value)) {
				return `${key}:\n${map(value, (item) => `  - "${item}"`).join(
					"\n"
				)}`;
			} else if (isBoolean(value)) {
				return `${key}: ${value}`;
			} else if (isDate(value)) {
				return `${key}: ${value.toISOString()}`;
			} else {
				return `${key}: ${value}`;
			}
		}).join("\n");
	}
}
