import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  type MenuItemConstructorOptions,
} from "electron";
import { Effect } from "effect";
import { WindowIds, type WindowId } from "../shared/windows";
import {
  WindowService,
  type WindowEffectRunner,
} from "./windows";

const isDarwin = process.platform === "darwin";

const openWindowFromMenu = (
  id: WindowId,
  browserWindow: BrowserWindow | undefined,
  runWindowEffect: WindowEffectRunner,
): void => {
  void runWindowEffect(
    Effect.gen(function* () {
      const windows = yield* WindowService;
      yield* windows.openWindow(id, browserWindow?.id);
    }),
  ).catch((error) => {
    console.error(`Failed to open window ${id}:`, error);
  });
};

const handleCheckForUpdates = (): void => {
  void dialog.showMessageBox({
    type: "info",
    title: "No Updates",
    message: "You're up to date.",
    detail: `Current version: ${app.getVersion()}`,
  });
};

const createAccountManagerMenuItem = (
  runWindowEffect: WindowEffectRunner,
): MenuItemConstructorOptions => ({
  label: "Account Manager...",
  click: (_menuItem, browserWindow) => {
    openWindowFromMenu(WindowIds.AccountManager, browserWindow, runWindowEffect);
  },
});

const createSettingsMenuItem = (
  runWindowEffect: WindowEffectRunner,
): MenuItemConstructorOptions => ({
  label: "Settings...",
  accelerator: isDarwin ? "Cmd+," : "Ctrl+,",
  click: (_menuItem, browserWindow) => {
    openWindowFromMenu(WindowIds.Settings, browserWindow, runWindowEffect);
  },
});

export const createApplicationMenu = (
  runWindowEffect: WindowEffectRunner,
): void => {
  const appSubmenu: MenuItemConstructorOptions[] = [
    { role: "about" },
    {
      label: "Check for Updates...",
      click: handleCheckForUpdates,
    },
    createAccountManagerMenuItem(runWindowEffect),
    createSettingsMenuItem(runWindowEffect),
    { type: "separator" },
    { role: "hide" },
    { role: "hideOthers" },
    { role: "unhide" },
    { type: "separator" },
    { role: "quit" },
  ];
  const fileSubmenu: MenuItemConstructorOptions[] = isDarwin
    ? [{ role: "close" }]
    : [
        createAccountManagerMenuItem(runWindowEffect),
        createSettingsMenuItem(runWindowEffect),
        { type: "separator" },
        { role: "quit" },
      ];
  const editSubmenu: MenuItemConstructorOptions[] = [
    { role: "undo" },
    { role: "redo" },
    { type: "separator" },
    { role: "cut" },
    { role: "copy" },
    { role: "paste" },
    ...(isDarwin
      ? ([
          { role: "pasteAndMatchStyle" },
          { role: "delete" },
          { role: "selectAll" },
        ] satisfies MenuItemConstructorOptions[])
      : ([
          { role: "delete" },
          { role: "selectAll" },
        ] satisfies MenuItemConstructorOptions[])),
  ];
  const viewSubmenu: MenuItemConstructorOptions[] = [
    { role: "reload" },
    { role: "forceReload" },
    { role: "toggleDevTools" },
    { type: "separator" },
    { role: "resetZoom" },
    { role: "zoomIn" },
    { role: "zoomOut" },
    { type: "separator" },
    { role: "togglefullscreen" },
  ];
  const template: MenuItemConstructorOptions[] = [
    ...(isDarwin
      ? [
          {
            label: app.name,
            submenu: appSubmenu,
          } satisfies MenuItemConstructorOptions,
        ]
      : []),
    {
      label: "File",
      submenu: fileSubmenu,
    },
    {
      label: "Edit",
      submenu: editSubmenu,
    },
    {
      label: "View",
      submenu: viewSubmenu,
    },
    { role: "windowMenu" },
  ];

  if (!isDarwin) {
    template.push({
      label: "Help",
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Check for Updates...",
          click: handleCheckForUpdates,
        },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};
