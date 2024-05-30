import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Vexed",
	description: "AQW Scripting Client for macOS",
	head: [["script", { src: "/_vercel/insights/script.js" }]],
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
					{
						text: "Downloading/Compiling",
						link: "/getting-started/downloading-compiling",
					},
					{ text: "Contributing", link: "/getting-started/contributing" },
					{ text: "Credits", link: "/getting-started/credits" },
					{ text: "Disclaimer", link: "/getting-started/disclaimer" },
				],
			},
			{
				text: "Scripting API",
				items: [
					{ text: "API Reference", link: "/api" },
					{ text: "Examples", link: "/api/examples" },
					{ text: "Auth", link: "/api/auth" },
					{ text: "Avatar", link: "/api/avatar" },
					{ text: "Bank", link: "/api/bank" },
					{ text: "Combat", link: "/api/combat" },
					{ text: "Drops", link: "/api/drops" },
					{ text: "Faction", link: "/api/faction" },
					{ text: "Flash", link: "/api/flash" },
					{ text: "House", link: "/api/house" },
					{ text: "Inventory", link: "/api/inventory" },
					{ text: "ItemBase", link: "/api/itembase" },
					{ text: "Monster", link: "/api/monster" },
					{ text: "Packet", link: "/api/packet" },
					{ text: "Player", link: "/api/player" },
					{ text: "Quest", link: "/api/quest" },
					{ text: "Quests", link: "/api/quests" },
					{ text: "Server", link: "/api/server" },
					{ text: "Settings", link: "/api/settings" },
					{ text: "TempInventory", link: "/api/tempinventory" },
					{ text: "World", link: "/api/world" },
				],
			},
		],
		socialLinks: [
			{ icon: "github", link: "https://github.com/toommyliu/vexed" },
		],
	},
});
