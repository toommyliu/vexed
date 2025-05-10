import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";
import apiLegacyJson from "./api-legacy.json";
import vercel from "@astrojs/vercel";

// https://astro.build/config

console.log(apiLegacyJson);

export default defineConfig({
  integrations: [
    starlight({
      title: "vexed",
      customCss: [
        "@fontsource/inter/100.css",
        "@fontsource/inter/200.css",
        "@fontsource/inter/300.css",
        "@fontsource/inter/400.css",
        "@fontsource/inter/500.css",
        "@fontsource/inter/600.css",
        "@fontsource/inter/700.css",
        "@fontsource/inter/800.css",
        "@fontsource/inter/900.css",
        "./src/styles/global.css",
        "./src/styles/theme.css",
      ],
      components: {
        SocialIcons: "./src/components/SocialIcons.astro",
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
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "guides/example" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
        {
          label: "API (Legacy)",
          items: apiLegacyJson,
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
