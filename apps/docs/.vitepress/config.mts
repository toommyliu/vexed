import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Vexed",
	description: "AQW Scripting Client for macOS",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Home", link: "/" },
			{ text: "API Reference", link: "/api-reference" },
		],
		sidebar: [
			{
				text: "Getting Started",
				items: [
					{ text: "Downloading/Compiling", link: "/getting-started/downloading-compiling" },
					{ text: "Contributing", link: "/getting-started/contributing" },
					{ text: "Credits", link: "/getting-started/credits" },
					{ text: "Disclaimer", link: "/getting-started/disclaimer" }
				]
			},
			{
				text: "Scripting API",
				items: [
					{ text: "API Reference", link: "/api" },
					{ text: "Examples", link: "/api/examples" },
					{ text: "Auth", link: "/api/auth" },
					{ text: "Server", link: "/api/server" },
					{ text: "Bank", link: "/api/bank" },
					{ text: "ItemBase", link: "/api/itembase" },
					{ text: "Combat", link: "/api/combat" },
					{ text: "Drops", link: "/api/drops" },
					{ text: "Flash", link: "/api/flash" },
					{ text: "House", link: "/api/house" },
					{ text: "Inventory", link: "/api/inventory" },
					{ text: "Packet", link: "/api/packet" },
					{ text: "Player", link: "/api/player" },
					{ text: "Faction", link: "/api/faction" },
					{ text: "Quests", link: "/api/quests" },
					{ text: "Quest", link: "/api/quest" },
					{ text: "Settings", link: "/api/settings" },
					{ text: "TempInventory", link: "/api/tempinventory" },
					{ text: "World", link: "/api/world" },
					{ text: "Avatar", link: "/api/avatar" },
					{ text: "Monster", link: "/api/monster" }
				],
			},
		],
		socialLinks: [
			{ icon: "github", link: "https://github.com/toommyliu/vexed" },
		],
	},
});
