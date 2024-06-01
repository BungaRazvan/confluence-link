import BaseClient from "./base";
import { Search } from "./search";
import { Page } from "./page";
import { Space } from "./space";
import { Client, Config } from "./types";
import { Attachements } from "./attachements";

export default class ConfluenceClient extends BaseClient {
	config: Config;

	constructor(config: Config) {
		super(config);
	}

	search = new Search(this as Client);
	page = new Page(this as Client);
	space = new Space(this as Client);
	attachement = new Attachements(this as Client);
}
