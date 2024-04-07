import BaseClient from "./base";
import { Search } from "./search";
import { Page } from "./page";
import { Space } from "./space";
import { Client, Config } from "./types";

export default class ConfluenceClient extends BaseClient {
	constructor(config: Config) {
		super(config);
	}

	search = new Search(this as Client);
	page = new Page(this as Client);
	space = new Space(this as Client);
}
