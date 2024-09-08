## Confluence Link

Welcome to the `Confluence Link` project. The objective of this project is to make it easy to write documentation on Obsidian and quicky create a Confluence page to share with you team members.

## Setting things up

1. Open the plugin settings and configure the following fields:

-   `Confluence Domain`: The URL of your Atlassian Confluence instance
-   `Atlassian User Name`: Your Atlassian account's email address
-   `Atlassian API Token`: Your Atlassian API token. You can generate one from your [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens).
-   (Optional) `Confluence Default Space`: The space identifier where all you confluence pages will be created

![Settings](./images/settings_tab.png)

2. (Optional) Open the default obsidian hotkeys settings:

-   search for `confluence-link`
-   add hotkeys

![Hotkeys](./images/hotkeys.png)

## Usage

1. Open a md file
2. Press the hotkey set at step 2 in [Settings things up](#Setting-things-up) section or use the command pallet (`Ctrl/Cmd + P` ) and search for `Confluence Link` commands to execute

![Commands](./images/commands.png)

## Nice to know

While the spaces modal is opened you can mark or unmark spaces as favorites by clicking the star icon. This will make them appear as the first results the next time you open this modal.

![Favorite_Spaces](./images/fav_spaces.png)

If a space is not in the initial list you can type `??` followed by the space title for a "fuzzy search" using all the spaces you have access to, not just the up to 250 that the confluence API can return in one request.

![Search](./images/search_spaces.png)

## Issues

Please log issues or feature requests to https://github.com/BungaRazvan/confluence-link/issues as this is where the code is being developed
