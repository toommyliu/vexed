//https://stackoverflow.com/a/75281896
import { defineConfig } from "vitepress";

import { join, basename } from "node:path";
import fs from "node:fs";

const md: string[] = [];
const apiDir = join(__dirname, "../api/");
const walk = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      walk(join(dir, file.name));
    } else {
      const filePath = join(dir, file.name);
      md.push(filePath);
    }
  }
};

walk(apiDir);

const enums = md.filter((path) => path.includes("/enums/"));
const examples = md.filter((path) => path.includes("/examples/"));
const structs = md.filter((path) => path.includes("/struct/"));
const typedefs = md.filter((path) => path.includes("/typedefs/"));
const excluded = [...enums, ...examples, ...structs, ...typedefs];

const rest = md.filter((path) => !excluded.includes(path));

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Vexed",
  titleTemplate: false,
  description: "AQW Scripting Client for macOS",
  head: [["script", { src: "/_vercel/insights/script.js" }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    editLink: {
      pattern: "https://github.com/toommyliu/vexed/edit/main/apps/docs/:path",
      text: "Edit this page on GitHub",
    },
    lastUpdated: {
      text: "Updated at",
      formatOptions: {
        dateStyle: "full",
        timeStyle: "medium",
      },
    },
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
            text: "Examples",
            link: "/api/examples/",
          },
          {
            text: "Data classes",
            items: structs.map((path) => ({
              text: path.split("/").pop()?.replace(".md", ""),
              link: `/api/struct/${basename(path)}`,
            })),
          },
          {
            text: "Enums",
            items: enums.map((path) => ({
              text: path.split("/").pop()?.replace(".md", ""),
              link: `/api/enums/${basename(path)}`,
            })),
          },
          {
            text: "Typedefs",
            items: typedefs.map((path) => ({
              text: path.split("/").pop()?.replace(".md", ""),
              link: `/api/typedefs/${basename(path)}`,
            })),
          },
          ...rest.map((path) => ({
            text: path.split("/").pop()?.replace(".md", ""),
            link: `/api/${basename(path)}`,
          })),
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/toommyliu/vexed" },
    ],
  },
});
