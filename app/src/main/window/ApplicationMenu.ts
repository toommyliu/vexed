import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  type MenuItemConstructorOptions,
} from "electron";
import { Effect } from "effect";
import type { AppSettings, ThemeMode } from "../../shared/settings";
import type { UpdateCheckState } from "../../shared/ipc";
import { WindowIds, type WindowId } from "../../shared/windows";
import { WindowService, type WindowEffectRunner } from "./WindowService";

const isDarwin = process.platform === "darwin";

export interface ApplicationMenuDependencies {
  readonly runWindowEffect: WindowEffectRunner;
  readonly getSettings: () => Promise<AppSettings>;
  readonly updateAppearance: (patch: {
    readonly themeMode: ThemeMode;
  }) => Promise<AppSettings>;
  readonly checkForUpdates: () => Promise<UpdateCheckState>;
  readonly logError: (
    component: string,
    message: string,
    error: unknown,
    data?: unknown,
  ) => void;
  readonly onSettingsChanged: (listener: () => void) => Promise<() => void>;
}

const openWindowFromMenu = (
  id: WindowId,
  browserWindow: BrowserWindow | undefined,
  deps: Pick<ApplicationMenuDependencies, "logError" | "runWindowEffect">,
): void => {
  void deps
    .runWindowEffect(
      Effect.gen(function* () {
        const windows = yield* WindowService;
        yield* windows.openWindow(id, browserWindow?.id);
      }),
    )
    .catch((error) => {
      deps.logError("menu", `Failed to open window ${id}`, error, {
        windowId: id,
        senderWindowId: browserWindow?.id,
      });
    });
};

const showUpdateResult = async (state: UpdateCheckState): Promise<void> => {
  if (state.status === "available") {
    await dialog.showMessageBox({
      type: "info",
      title: "Update Available",
      message: `Vexed ${state.latestVersion} is available.`,
      detail: `Current version: ${state.currentVersion}\nRelease: ${state.release.htmlUrl}`,
    });
    return;
  }

  if (state.status === "failed") {
    await dialog.showMessageBox({
      type: "warning",
      title: "Update Check Failed",
      message: state.error,
      detail: `Current version: ${state.currentVersion}`,
    });
    return;
  }

  await dialog.showMessageBox({
    type: "info",
    title: "No Updates",
    message: "You're up to date.",
    detail: `Current version: ${state.currentVersion}`,
  });
};

const createAccountManagerMenuItem = (
  deps: Pick<ApplicationMenuDependencies, "logError" | "runWindowEffect">,
): MenuItemConstructorOptions => ({
  label: "Account Manager...",
  click: (_menuItem, browserWindow) => {
    openWindowFromMenu(WindowIds.AccountManager, browserWindow, deps);
  },
});

const createSettingsMenuItem = (
  deps: Pick<ApplicationMenuDependencies, "logError" | "runWindowEffect">,
): MenuItemConstructorOptions => ({
  label: "Settings...",
  accelerator: isDarwin ? "Cmd+," : "Ctrl+,",
  click: (_menuItem, browserWindow) => {
    openWindowFromMenu(WindowIds.Settings, browserWindow, deps);
  },
});

const createAppearanceMenuItem = (
  mode: ThemeMode,
  label: string,
  currentMode: ThemeMode,
  updateAppearance: ApplicationMenuDependencies["updateAppearance"],
): MenuItemConstructorOptions => ({
  label,
  type: "radio",
  checked: currentMode === mode,
  click: () => {
    void updateAppearance({ themeMode: mode });
  },
});

let activeDependencies: ApplicationMenuDependencies | null = null;
let settingsMenuListenerRegistered = false;

const rebuildApplicationMenu = (): void => {
  if (!activeDependencies) {
    return;
  }

  void installApplicationMenu(activeDependencies);
};

const registerSettingsMenuListener = async (
  dependencies: ApplicationMenuDependencies,
): Promise<void> => {
  if (settingsMenuListenerRegistered) {
    return;
  }

  await dependencies.onSettingsChanged(() => {
    rebuildApplicationMenu();
  });
  settingsMenuListenerRegistered = true;
};

const installApplicationMenu = async (
  dependencies: ApplicationMenuDependencies,
): Promise<void> => {
  const appearance = (await dependencies.getSettings()).appearance;
  const appSubmenu: MenuItemConstructorOptions[] = [
    { role: "about" },
    {
      label: "Check for Updates...",
      click: () => {
        void dependencies.checkForUpdates().then(showUpdateResult);
      },
    },
    createAccountManagerMenuItem(dependencies),
    createSettingsMenuItem(dependencies),
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
        createAccountManagerMenuItem(dependencies),
        createSettingsMenuItem(dependencies),
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
    {
      label: "Appearance",
      submenu: [
        createAppearanceMenuItem(
          "light",
          "Light",
          appearance.themeMode,
          dependencies.updateAppearance,
        ),
        createAppearanceMenuItem(
          "dark",
          "Dark",
          appearance.themeMode,
          dependencies.updateAppearance,
        ),
        createAppearanceMenuItem(
          "system",
          "System",
          appearance.themeMode,
          dependencies.updateAppearance,
        ),
      ],
    },
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
    { label: "File", submenu: fileSubmenu },
    { label: "Edit", submenu: editSubmenu },
    { label: "View", submenu: viewSubmenu },
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
          click: () => {
            void dependencies.checkForUpdates().then(showUpdateResult);
          },
        },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

export const createApplicationMenu = async (
  dependencies: ApplicationMenuDependencies,
): Promise<void> => {
  activeDependencies = dependencies;
  await registerSettingsMenuListener(dependencies);
  await installApplicationMenu(dependencies);
};
