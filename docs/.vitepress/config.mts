import { defineConfig } from 'vitepress';

import { join, basename } from 'node:path';
import fs from 'node:fs';

const md: string[] = [];
const apiDir = join(__dirname, '../api-legacy/');
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

const enums = md
  .filter((path) => path.includes('/enums/'))
  .sort((a, b) => basename(a).localeCompare(basename(b)));
const models = md
  .filter((path) => path.includes('/models/'))
  .sort((a, b) => basename(a).localeCompare(basename(b)));
const typedefs = md
  .filter((path) => path.includes('/typedefs/'))
  .sort((a, b) => basename(a).localeCompare(basename(b)));
const util = md
  .filter((path) => path.includes('/util/'))
  .sort((a, b) => basename(a).localeCompare(b));
const excluded = [...enums, ...models, ...typedefs, ...util];

const rest = md
  .filter((path) => !excluded.includes(path) && !path.includes('variables'))
  .sort((a, b) => basename(a).localeCompare(basename(b)));

function getMarkdownTitle(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^#\s+([^<\n]+)/m);
    return match ? match[1].trim() : basename(filePath, '.md');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return basename(filePath, '.md');
  }
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Vexed',
  titleTemplate: false,
  description: 'Crossplatform AQW Scripting Client',
  head: [['script', { src: '/_vercel/insights/script.js' }]],
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    editLink: {
      pattern: 'https://github.com/toommyliu/vexed/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    search: {
      provider: 'local',
    },
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium',
      },
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Reference', link: '/api-legacy' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          {
            text: 'Downloading',
            link: '/getting-started/downloading',
          },
          { text: 'Credits', link: '/getting-started/credits' },
          { text: 'Disclaimer', link: '/getting-started/disclaimer' },
          {
            text: 'For Developers',
            items: [
              {
                text: 'Compiling',
                link: '/getting-started/advanced/compiling',
              },
              {
                text: 'Contributing',
                link: '/getting-started/advanced/contributing',
              },
            ],
          },
        ],
      },
      {
        text: 'Usage',
        items: [
          {
            text: 'Account Manager',
            link: '/usage/account-manager/',
          },
          {
            text: 'Game',
            link: '/usage/game/',
          },
        ],
      },
      {
        text: 'Scripting API (Commands)',
        link: '/api',
        items: [
          {
            text: 'Available Commands',
            items: [
              {
                text: 'Combat',
                link: '/api/combat',
              },
              {
                text: 'Conditions',
                link: '/api/conditions',
              },
              {
                text: 'Item',
                link: '/api/item',
              },
              {
                text: 'Map',
                link: '/api/map',
              },
              {
                text: 'Misc',
                link: '/api/misc',
              },
              {
                text: 'Quest',
                link: '/api/quest',
              },
            ],
          },
          {
            text: 'Examples',
            link: '/api/examples',
          },
          {
            text: 'For Developers',
            items: [
              {
                text: 'Custom Commands',
                link: '/api/for-developers/custom-commands',
              },
              {
                text: 'Custom Handlers',
                link: '/api/for-developers/custom-handlers',
              },
            ],
          },
        ],
      },
      {
        text: 'Scripting API (Legacy)',
        items: [
          // ...(models.length > 0
          ...(true
            ? [
                {
                  text: 'Models',
                  items: models.map((path) => ({
                    text: getMarkdownTitle(path),
                    link: `/api-legacy/models/${basename(path)}`,
                  })),
                  collapsed: true,
                },
              ]
            : []),
          ...(enums.length > 0
            ? [
                {
                  text: 'Enums',
                  items: enums.map((path) => ({
                    text: getMarkdownTitle(path),
                    link: `/api-legacy/enums/${basename(path)}`,
                  })),
                  collapsed: true,
                },
              ]
            : []),
          ...(typedefs.length > 0
            ? [
                {
                  text: 'Typedefs',
                  items: typedefs.map((path) => ({
                    text: getMarkdownTitle(path),
                    link: `/api-legacy/typedefs/${basename(path)}`,
                  })),
                  collapsed: true,
                },
              ]
            : []),
          ...(util.length > 0
            ? [
                {
                  text: 'Util',
                  items: util.map((path) => ({
                    text: getMarkdownTitle(path),
                    link: `/api-legacy/util/${basename(path)}`,
                  })),
                  collapsed: true,
                },
              ]
            : []),
          ...rest.map((path) => ({
            text: getMarkdownTitle(path),
            link: `/api-legacy/${basename(path)}`,
          })),
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/toommyliu/vexed' },
    ],
  },
});
