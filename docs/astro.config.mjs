import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { createInlineSvgUrl } from "@astrojs/starlight/expressive-code";

export default defineConfig({
  integrations: [
    starlight({
      title: "vexed",
      components: {
        ContentPanel: "./src/components/ContentPanel.astro",
        Footer: "./src/components/Footer.astro",
        Head: "./src/components/Head.astro",
        Header: "./src/components/Header.astro",
        MarkdownContent: "./src/components/MarkdownContent.astro",
        PageFrame: "./src/components/PageFrame.astro",
        PageSidebar: "./src/components/PageSidebar.astro",
        Pagination: "./src/components/Pagination.astro",
        Search: "./src/components/Search.astro",
        Sidebar: "./src/components/Sidebar.astro",
        SiteTitle: "./src/components/SiteTitle.astro",
        SocialIcons: "./src/components/SocialIcons.astro",
        TableOfContents: "./src/components/TableOfContents.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
        TwoColumnContent: "./src/components/TwoColumnContent.astro",
      },
      customCss: [
        "./src/styles/layers.css",
        "./src/styles/ui-tokens.css",
        "./src/styles/theme.css",
        "./src/styles/base.css",
      ],
      expressiveCode: {
        themes: ["github-dark-default", "github-light-default"],
        styleOverrides: {
          codeBackground: "var(--code-background)",
          borderWidth: "0px",
          borderRadius: "calc(var(--radius) + 4px)",
          gutterBorderWidth: "0px",
          frames: {
            editorBackground: "var(--code-background)",
            editorActiveTabBackground: "var(--gray-5)",
            editorActiveTabForeground: "var(--foreground)",
            editorTabBarBackground: "var(--gray-6)",
            editorTabBarBorderColor: "var(--border)",
            editorTabBarBorderBottomColor: "var(--border)",
            terminalBackground: "var(--code-background)",
            terminalTitlebarBackground: "var(--gray-6)",
            terminalTitlebarBorderBottomColor: "var(--border)",
            terminalTitlebarForeground: "var(--muted-foreground)",
            shadowColor: "transparent",
            copyIcon: createInlineSvgUrl(
              '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>',
            ),
          },
          textMarkers: {
            markBackground: "var(--mark-background)",
            markBorderColor: "var(--border)",
          },
        },
      },
      sidebar: [
        { link: "/", label: "Overview" },
        {
          label: "Scripting API",
          items: [
            { link: "/scripting/", label: "Overview" },
            { link: "/scripting/script/", label: "Script" },
            { link: "/scripting/imports/", label: "Imports" },
            {
              label: "Features",
              items: [
                { link: "/scripting/features/", label: "Features" },
                { link: "/scripting/features/auto-zone/", label: "Auto Zone" },
                {
                  link: "/scripting/features/auto-relogin/",
                  label: "Auto Relogin",
                },
                {
                  link: "/scripting/features/anti-counter/",
                  label: "Anti-Counter",
                },
              ],
            },
            {
              label: "API",
              items: [
                { link: "/scripting/api/", label: "API" },
                { link: "/scripting/api/army/", label: "Army" },
                { link: "/scripting/api/auth/", label: "Auth" },
                { link: "/scripting/api/bank/", label: "Bank" },
                { link: "/scripting/api/combat/", label: "Combat" },
                { link: "/scripting/api/drops/", label: "Drops" },
                { link: "/scripting/api/environment/", label: "Environment" },
                { link: "/scripting/api/house/", label: "House" },
                { link: "/scripting/api/inventory/", label: "Inventory" },
                { link: "/scripting/api/packet/", label: "Packet" },
                { link: "/scripting/api/player/", label: "Player" },
                { link: "/scripting/api/quests/", label: "Quests" },
                { link: "/scripting/api/recipes/", label: "Recipes" },
                { link: "/scripting/api/settings/", label: "Settings" },
                { link: "/scripting/api/shops/", label: "Shops" },
                {
                  link: "/scripting/api/temp-inventory/",
                  label: "Temp Inventory",
                },
                { link: "/scripting/api/wait/", label: "Wait" },
                { link: "/scripting/api/world/", label: "World" },
              ],
            },
            {
              label: "Types",
              collapsed: true,
              autogenerate: {
                directory: "scripting/types",
                collapsed: true,
              },
            },
          ],
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/toommyliu/vexed",
        },
      ],
    }),
  ],
});
