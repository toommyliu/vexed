import { join, sep } from "path";
import type Config from "@vexed/config";
import {
  deleteFile,
  pathExists,
  readDirRecursive,
  deleteDirectory,
} from "@vexed/fs-utils";
import type { MenuItemConstructorOptions } from "electron";
import { app, dialog, Menu, nativeTheme, session, shell } from "electron";
import { IS_MAC } from "~/shared/constants";
import type { Settings } from "~/shared/types";
import { logger } from "./services/logger";
import { updaterService } from "./services/updater";
import { windowsService } from "./services/windows";
import { showErrorDialog } from "./util/dialog";

async function updateTheme(
  settings: Config<Settings>,
  theme: Settings["theme"],
) {
  nativeTheme.themeSource = theme;
  await settings.setAndSave("theme", theme);
}

async function handleCheckForUpdates() {
  const updateResult = await updaterService.checkForUpdates(true);
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

const _deleteDirectory = async (dirPath: string) => {
  if (!(await pathExists(dirPath))) {
    console.log(`Directory does not exist: ${dirPath}`);
    return;
  }

  try {
    const dirs = new Set<string>();
    const files = new Set<string>();

    await readDirRecursive(dirPath, {
      filter: (_, absPath, stats) => {
        if (stats.isFile()) files.add(absPath);
        else if (stats.isDirectory()) dirs.add(absPath);
        return true;
      },
    });

    // Delete files first
    for (const filePath of files) await deleteFile(filePath);

    // Sort the directories by depth (a.k.a deepest path first)
    const sortedDirs = Array.from(dirs).sort(
      (a, b) => b.split(sep).length - a.split(sep).length,
    );
    for (const dir of sortedDirs) await deleteDirectory(dir);

    await deleteDirectory(dirPath);
  } catch (error) {
    logger.error("main", "Failed to clear Flash cache", error);
    showErrorDialog({
      message: "Failed to clear Flash cache",
    });
  }
};

function clearAppCache() {
  void session.defaultSession?.clearStorageData({
    storages: ["cookies", "appcache", "localstorage"],
  });
}

async function clearFlashCache() {
  const flashPath = join(
    app.getPath("userData"),
    "Pepper Data",
    "Shockwave Flash",
    "WritableRoot",
  );

  await _deleteDirectory(flashPath);

  const { response } = await dialog.showMessageBox({
    message: "Flash cache cleared successfully. A restart is required.",
    type: "info",
    buttons: ["Quit", "Later"],
    defaultId: 0,
  });

  if (response === 0) app.quit();
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
                  await windowsService.createOnboarding();
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
                await windowsService.createOnboarding();
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
