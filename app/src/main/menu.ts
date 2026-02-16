import { join } from "path";
import type Config from "@vexed/config";
import * as fs from '@vexed/fs';
import type { MenuItemConstructorOptions } from "electron";
import { app, dialog, Menu, nativeTheme, session, shell } from "electron";
import type { Settings } from "~/shared/types";
import { IS_MAC } from "./constants";
import { createLogger } from "./services/logger";
import { updaterService } from "./services/updater";
import { windowsService } from "./services/windows";

const logger = createLogger('app:menu');

async function updateTheme(
  settings: Config<Settings>,
  theme: Settings["theme"],
) {
  nativeTheme.themeSource = theme;
  await settings.setAndSave("theme", theme);
}

async function handleCheckForUpdates() {
  const updateResult = await updaterService.run(true);
  if (!updateResult) {
    void dialog.showMessageBox({
      type: "info",
      title: "No Updates",
      message: "You're up to date!",
      detail: `Current version: ${app.getVersion()}`,
    });
    return;
  }

  const { response } = await dialog.showMessageBox({
    type: "info",
    title: "Update Available",
    message: `A new version is available: ${updateResult.newVersion}`,
    detail: `You are currently on version ${updateResult.currentVersion}.`,
    buttons: ["Download", "Later"],
    defaultId: 0,
  });
  if (response === 0) void shell.openExternal(updateResult.releaseUrl);
}

function clearAppCache() {
  void session.defaultSession?.clearStorageData({
    storages: ["cookies", "appcache", "localstorage"],
  // eslint-disable-next-line promise/prefer-await-to-callbacks, promise/prefer-await-to-then
  }).catch((error) => {
    logger.error("Failed to clear app cache", error);
    return null;
  })
}

async function clearFlashCache() {
  const flashPath = join(
    app.getPath("userData"),
    "Pepper Data",
    "Shockwave Flash",
    "WritableRoot",
  );

  await fs.deleteDir(flashPath);

  const { response } = await dialog.showMessageBox({
    message: "Flash cache cleared successfully. A restart is required.",
    type: "info",
    buttons: ["Quit", "Later"],
    defaultId: 0,
  });
  if (response === 0 /* Quit */) app.quit();
}

export function createMenu(settings: Config<Settings>) {
  const template: MenuItemConstructorOptions[] = [
    // { role: 'appMenu' }
    ...(IS_MAC
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              {
                label: "Check for Updates...",
                click: handleCheckForUpdates,
              },
              {
                label: "Settings...",
                accelerator: "Cmd+,",
                click: async () => {
                  windowsService.onboarding();
                },
              },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: "File",
      submenu: IS_MAC
        ? [{ role: "close" }]
        : [
            {
              label: "Settings",
              accelerator: "Ctrl+,",
              click: async () => {
                windowsService.onboarding();
              },
            },
            { type: "separator" },
            { role: "quit" },
          ],
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(IS_MAC
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        {
          label: "Command Palette",
          accelerator: IS_MAC ? "Cmd+K" : "Ctrl+K",
          click: (_, browserWindow) => {
            // TODO: this is a little jank
            if (!browserWindow) return;

            const gameWindow = browserWindow.getParentWindow() ?? browserWindow;
            void gameWindow.webContents.executeJavaScript(
              `window.dispatchEvent(new CustomEvent('openCommandPalette'))`,
            );
          },
        },
        { type: "separator" },
        {
          label: "Appearance",
          submenu: [
            {
              label: "Light",
              type: "radio",
              checked: settings.get("theme") === "light",
              click: async () => updateTheme(settings, "light"),
            },
            {
              label: "Dark",
              type: "radio",
              checked: settings.get("theme") === "dark",
              click: async () => updateTheme(settings, "dark"),
            },
            {
              label: "System",
              type: "radio",
              checked: settings.get("theme") === "system",
              click: async () => updateTheme(settings, "system"),
            },
          ],
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    // { role: 'windowMenu' }
    {
      role: "windowMenu",
    },
    // { role: 'helpMenu' }
    {
      label: "Help",
      submenu: [
        ...(IS_MAC
          ? []
          : [
              {
                label: `About ${app.name}`,
                click: () => {
                  void dialog.showMessageBox({
                    type: "info",
                    title: `About ${app.name}`,
                    message: app.name,
                    detail: `Version: ${app.getVersion()}`,
                  });
                },
              },
              { type: "separator" },
              {
                label: "Check for Updates...",
                click: handleCheckForUpdates,
              },
              { type: "separator" },
            ]),
        {
          label: "Clear App Cache",
          click: clearAppCache,
        },
        {
          label: "Clear Flash Cache",
          click: () => void clearFlashCache(),
        },
      ],
    },
  ] as MenuItemConstructorOptions[];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
