import type Config from "@vexed/config";
import type { MenuItemConstructorOptions } from "electron";
import { app, dialog, Menu, nativeTheme, shell } from "electron";
import { IS_MAC } from "../shared/constants";
import type { Settings } from "../shared/types";
import { checkForUpdates } from "./updater";

async function updateTheme(settings: Config<Settings>, theme: Settings['theme']) {
    nativeTheme.themeSource = theme;
    await settings.setAndSave('theme', theme);
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
                            click: async () => {
                                const res = await checkForUpdates(true);
                                if (!res) {
                                    dialog.showMessageBox({
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
                                    message: `A new version is available: ${res.newVersion}`,
                                    detail: `You are currently on version ${res.currentVersion}.`,
                                    buttons: ["Download", "Later"],
                                    defaultId: 0,
                                });

                                if (response === 0)
                                    shell.openExternal(res.releaseUrl);
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
            submenu: [IS_MAC ? { role: "close" } : { role: "quit" }],
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
                            `window.dispatchEvent(new CustomEvent('openCommandPalette'))`
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
                            click: async () =>
                                await updateTheme(settings, "light")

                        },
                        {
                            label: "Dark",
                            type: "radio",
                            checked: settings.get("theme") === "dark",
                            click: async () =>
                                await updateTheme(settings, "dark")

                        },
                        {
                            label: "System",
                            type: "radio",
                            checked: settings.get("theme") === "system",
                            click: async () =>
                                await updateTheme(settings, "system")

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
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "zoom" },
                ...(IS_MAC
                    ? [
                        { type: "separator" },
                        { role: "front" },
                        { type: "separator" },
                        { role: "window" },
                    ]
                    : [{ role: "close" }]),
            ],
        },
    ] as MenuItemConstructorOptions[];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
