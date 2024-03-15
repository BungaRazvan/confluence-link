import BaseClient from "./base";
import { Search } from "./search";
import { Page } from "./page";
import { Config } from "./types";

export default class ConfluenceClient extends BaseClient {
	constructor(config: Config) {
		super(config);
	}

	search = new Search(this);
	page = new Page(this);
}
