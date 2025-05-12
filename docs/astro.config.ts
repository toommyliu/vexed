import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";
import vercel from "@astrojs/vercel";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

import apiJson from "./api.json";
import apiLegacyJson from "./api-legacy.json";

// https://astro.build/config

export default defineConfig({
  integrations: [
    starlight({
      title: "vexed",
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
          href: "https://github.com/withastro/starlight",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
        {
          label: "API",
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
