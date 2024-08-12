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
      { text: "API Reference", link: "/api" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Downloading", link: "/getting-started/downloading" },
          { text: "Compiling", link: "/getting-started/compiling" },
          { text: "Contributing", link: "/getting-started/contributing" },
          { text: "Credits", link: "/getting-started/credits" },
          { text: "Disclaimer", link: "/getting-started/disclaimer" },
        ],
      },
      {
        text: "Usage",
        items: [
          { text: "Account Manager", link: "/usage/account-manager" },
          {
            text: "Scripts",
            link: "/usage/scripts",
          },
          { text: "Tools", link: "/usage/tools" },
          { text: "Packets", link: "/usage/packets" },
        ],
      },
      {
        text: "Scripting API",
        items: [
          {
            text: "Getting started",
            link: "/api/",
            items: [{ text: "Examples", link: "/api/examples" }],
          },
          {
            text: "Data classes",
            link: "/api/struct/",
            items: [
              { text: "Avatar", link: "/api/struct/avatar" },
              { text: "Faction", link: "/api/struct/faction" },
              { text: "InventoryItem", link: "/api/struct/inventoryitem" },
              { text: "Item", link: "/api/struct/item" },
              { text: "Monster", link: "/api/struct/monster" },
              { text: "Quest", link: "/api/struct/quest" },
              { text: "Server", link: "/api/struct/server" },
            ],
          },
          { text: "Auth", link: "/api/auth" },
          { text: "Bank", link: "/api/bank" },
          { text: "Bot", link: "/api/bot" },
          { text: "Combat", link: "/api/combat" },
          { text: "Drops", link: "/api/drops" },
          { text: "Flash", link: "/api/flash" },
          { text: "House", link: "/api/house" },
          { text: "Inventory", link: "/api/inventory" },
          { text: "Packets", link: "/api/packets" },
          { text: "Player", link: "/api/player" },
          { text: "Quests", link: "/api/quests" },
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
