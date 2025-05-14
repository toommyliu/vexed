import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";
import vercel from "@astrojs/vercel";

import apiJson from "./api.json";
import apiLegacyJson from "./api-legacy.json";

// https://astro.build/config

export default defineConfig({
  integrations: [
    starlight({
      title: "vexed",
      favicon: "/favicon.ico",
      editLink: {
        baseUrl: "https://github.com/toommyliu/vexed/docs/",
      },
      lastUpdated: true,
      customCss: ["./src/styles/global.css", "./src/styles/theme.css"],
      components: {
        Hero: "./src/components/Hero.astro",
        SocialIcons: "./src/components/SocialIcons.astro",
        TableOfContents: "./src/components/TableOfContents.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/toommyliu/vexed",
        },
      ],
      sidebar: [
        {
          label: "Disclaimer",
          link: "/disclaimer/",
        },
        {
          label: "Credits",
          link: "/credits/",
        },
        {
          label: "Contributing",
          link: "/contributing/",
        },
        {
          label: "Guides",
          items: [
            {
              label: "Getting Started",
              link: "/guides/getting-started/",
            },
            {
              label: "Custom Commands",
              link: "/guides/custom-commands/",
            },
            {
              label: "Custom Handlers",
              link: "/guides/custom-handlers/",
            },
            {
              label: "Advanced",
              items: [
                {
                  label: "Armying",
                  link: "/guides/armying",
                },
                {
                  label: "Development",
                  link: "/guides/development",
                },
              ],
            },
          ],
        },
        {
          label: "Reference",
          items: [
            {
              label: "Game",
              link: "/reference/game/",
            },
            {
              label: "Manager",
              link: "/reference/manager/",
            },
          ],
        },
        {
          label: "API (Commands)",
          items: apiJson,
        },
        {
          label: "API (Legacy)",
          items: apiLegacyJson,
          collapsed: true,
        },
      ],
    }),
  ],
  // https://docs.astro.build/en/reference/errors/missing-sharp/
  image: {
    service: passthroughImageService(),
  },
  adapter: vercel(),
});
