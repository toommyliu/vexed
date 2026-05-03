import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "vexed",
      components: {
        Head: "./src/components/Head.astro",
      },
      sidebar: [
        { link: "/", label: "Overview" },
        {
          label: "Script Commands",
          autogenerate: {
            directory: "script-commands",
            collapsed: false,
          },
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
