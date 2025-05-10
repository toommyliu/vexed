import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";
import apiLegacyJson from "./api-legacy.json";
import vercel from "@astrojs/vercel";

// https://astro.build/config

export default defineConfig({
  integrations: [
    starlight({
      title: "vexed",
      customCss: [
        "/fonts/geist-mono/100.css?url",
        "/fonts/geist-mono/200.css?url",
        "/fonts/geist-mono/300.css?url",
        "/fonts/geist-mono/400.css?url",
        "/fonts/geist-mono/500.css?url",
        "/fonts/geist-mono/600.css?url",
        "/fonts/geist-mono/700.css?url",
        "/fonts/geist-mono/800.css?url",
        "/fonts/geist-mono/900.css?url",
        "/fonts/geist-sans/100.css?url",
        "/fonts/geist-sans/200.css?url",
        "/fonts/geist-sans/300.css?url",
        "/fonts/geist-sans/400.css?url",
        "/fonts/geist-sans/500.css?url",
        "/fonts/geist-sans/600.css?url",
        "/fonts/geist-sans/700.css?url",
        "/fonts/geist-sans/800.css?url",
        "/fonts/geist-sans/900.css?url",
        "./src/styles/global.css",
        "./src/styles/theme.css",
      ],
      components: {
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
