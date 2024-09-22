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
const utils = md.filter((path) => path.includes("/utils/"));
const excluded = [...enums, ...examples, ...structs, ...typedefs, utils];

const rest = md.filter((path) => !excluded.includes(path));

function getMarkdownTitle(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^#\s+([^<\n]+)/m);
    return match ? match[1].trim() : basename(filePath, ".md");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return basename(filePath, ".md");
  }
}

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
          // {
          //   text: "Examples",
          //   link: "/api/examples/",
          // },
          // {
          //   text: "Data classes",
          //   items: structs.map((path) => ({
          //     text: getMarkdownTitle(path),
          //     link: `/api/struct/${basename(path)}`,
          //   })),
          // },
          // {
          //   text: "Enums",
          //   items: enums.map((path) => ({
          //     text: getMarkdownTitle(path),
          //     link: `/api/enums/${basename(path)}`,
          //   })),
          // },
          // {
          //   text: "Typedefs",
          //   items: typedefs.map((path) => ({
          //     text: getMarkdownTitle(path),
          //     link: `/api/typedefs/${basename(path)}`,
          //   })),
          // },
          // {
          //   text: "Utils",
          //   items: utils.map((path) => ({
          //     text: getMarkdownTitle(path),
          //     link: `/api/utils/${basename(path)}`,
          //   })),
          // },
          ...rest.map((path) => ({
            text: getMarkdownTitle(path),
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
