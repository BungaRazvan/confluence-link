import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import ConfluenceLinkPlugin from "main";

import ConfluenceClient from "./confluence/client";
import SpaceSearchModal from "./modal";
import { isFloat } from "./utils";

export class ConfluenceLinkSettingsTab extends PluginSettingTab {
	plugin: ConfluenceLinkPlugin;
	showToken: boolean;

	constructor(app: App, plugin: ConfluenceLinkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.showToken = false;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Confluence domain")
			.setDesc("eg: https://test.attlasian.net")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.confluenceDomain)
					.onChange(async (value) => {
						this.plugin.settings.confluenceDomain = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Atlassian username")
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
			.setName("Atlassian api token")
			.setDesc(
				createFragment((el) => {
					el.appendChild(
						createEl("a", {
							text: "Official documentation",
							href: "https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
						})
					);
				})
			)
			.addExtraButton((button) =>
				button
					.setTooltip("Copy token")
					.setIcon("copy")
					.onClick(async () => {
						if (this.plugin.settings.atlassianApiToken) {
							await navigator.clipboard.writeText(
								this.plugin.settings.atlassianApiToken
							);
							new Notice("Token copied");
						}
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon(this.showToken ? "eye-off" : "eye")
					.onClick(() => {
						this.showToken = !this.showToken;
						this.display();
					})
					.setTooltip(this.showToken ? "Hide token" : "Show token")
			)
			.addText((text) => {
				text.setValue(this.plugin.settings.atlassianApiToken).onChange(
					async (value) => {
						this.plugin.settings.atlassianApiToken = value;
						await this.plugin.saveSettings();
					}
				);

				text.inputEl.setAttr(
					"type",
					this.showToken ? "text" : "password"
				);
			});

		new Setting(containerEl).addButton((button) =>
			button.setButtonText("Test Connection").onClick(async () => {
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
					new Notice("Confluence Link: Connection established!");
				} catch (e) {
					new Notice("Confluence Link: Connection failed!");
				}

				button.setButtonText("Test Connection");
				button.setDisabled(false);
			})
		);

		new Setting(containerEl)
			.setName("Confluence default space")
			.setDesc("Default spaceId to create the files")
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
							this.plugin,
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
				let wait: number | null = null;

				text.setValue(
					this.plugin.settings.confluenceDefaultSpaceId
				).onChange(async (value) => {
					if (Number(value) && !isFloat(Number(value))) {
						this.plugin.settings.confluenceDefaultSpaceId = value;
						await this.plugin.saveSettings();
					} else {
						if (wait) {
							window.clearTimeout(wait);
						}

						wait = window.setTimeout(() => {
							this.display();
							new Notice("Please enter a valid space id.");
						}, 500);
					}
				});
			});

		new Setting(containerEl)
			.setName("Follow links")
			.setDesc(
				"Enable to follow internal links and create those as confluence pages as well"
			)
			.addToggle((cb) => {
				cb.setValue(this.plugin.settings.followLinks || false);

				cb.onChange((value) => {
					this.plugin.settings.followLinks = value;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Upload tags")
			.setDesc(
				"Enable to add the tags from the obsidian file to the confluence page as well"
			)
			.addToggle((cb) => {
				cb.setValue(this.plugin.settings.uploadTags || false);

				cb.onChange((value) => {
					this.plugin.settings.uploadTags = value;
					this.plugin.saveSettings();
				});
			});
	}
}
