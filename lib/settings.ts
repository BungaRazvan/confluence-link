import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import Obs2ConFluxPlugin from "main";

import ConfluenceClient from "./confluence/client";
import SpaceSearchModal from "./modal";
import { isFloat } from "./utils";

export class Obs2ConFluxSettingsTab extends PluginSettingTab {
	plugin: Obs2ConFluxPlugin;

	constructor(app: App, plugin: Obs2ConFluxPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Settings for connecting to Atlassian",
		});

		new Setting(containerEl)
			.setName("Confluence Domain")
			.setDesc("Confluence Domain eg: https://test.attlasian.net")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.confluenceDomain)
					.onChange(async (value) => {
						this.plugin.settings.confluenceDomain = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Atlassian Username")
			.setDesc("eg: user@domain.com")
			.addText((text) => {
				text.setValue(this.plugin.settings.atlassianUsername).onChange(
					async (value) => {
						this.plugin.settings.atlassianUsername = value;
						await this.plugin.saveSettings();
					}
				);
			});

		new Setting(containerEl)
			.setName("Atlassian API Token")
			.setDesc("API token")
			.addText((text) => {
				text.setValue(this.plugin.settings.atlassianApiToken).onChange(
					async (value) => {
						this.plugin.settings.atlassianApiToken = value;
						await this.plugin.saveSettings();
					}
				);
			});

		new Setting(containerEl).addButton((button) =>
			button.setButtonText("Test Connection").onClick(async (value) => {
				button.setDisabled(true);
				button.setButtonText("Testing...");

				const {
					confluenceDomain,
					atlassianUsername,
					atlassianApiToken,
				} = this.plugin.settings;

				if (
					!confluenceDomain ||
					!atlassianApiToken ||
					!atlassianApiToken
				) {
					return new Notice("Settings for connection not set up");
				}

				const client = new ConfluenceClient({
					host: confluenceDomain,
					authentication: {
						email: atlassianUsername,
						apiToken: atlassianApiToken,
					},
				});

				try {
					await client.search.searchByCQL({
						cql: "id != 0 order by lastmodified desc",
					});
					new Notice("Obs2Con Flux: Connection established!");
				} catch (e) {
					new Notice("Obs2Con Flux: Connection failed!");
				}

				button.setButtonText("Test Connection");
				button.setDisabled(false);
			})
		);

		new Setting(containerEl)
			.setName("Confluence default space")
			.setDesc("Default spaceId to save the files")
			.addExtraButton((button) => {
				button
					// .setIcon()
					.setTooltip("Choose default spaceId")
					.onClick(() => {
						const {
							atlassianUsername,
							atlassianApiToken,
							confluenceDomain,
						} = this.plugin.settings;

						if (
							!atlassianApiToken ||
							!atlassianUsername ||
							!confluenceDomain
						) {
							new Notice(
								"Please set up the above settings first"
							);
							return;
						}

						const client = new ConfluenceClient({
							host: confluenceDomain,
							authentication: {
								email: atlassianUsername,
								apiToken: atlassianApiToken,
							},
						});
						new SpaceSearchModal(
							this.app,
							client,
							async (result) => {
								this.plugin.settings.confluenceDefaultSpaceId =
									result.id;
								await this.plugin.saveSettings();

								this.display(); // Reload the settings tab
							}
						).open();
					});
			})
			.addText((text) => {
				let wait: NodeJS.Timeout | null = null;

				text.setValue(
					this.plugin.settings.confluenceDefaultSpaceId
				).onChange(async (value) => {
					if (Number(value) && !isFloat(Number(value))) {
						this.plugin.settings.confluenceDefaultSpaceId = value;
						await this.plugin.saveSettings();
					} else {
						if (wait) {
							clearTimeout(wait);
						}

						wait = setTimeout(() => {
							this.display();
							new Notice("Please enter a valid space id.");
						}, 500);
					}
				});
			});
	}
}
