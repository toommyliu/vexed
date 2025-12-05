import Config from "@vexed/config";
import { app, Menu, MenuItemConstructorOptions, nativeTheme } from "electron";
import { IS_MAC } from "../shared/constants";
import type { Settings } from "../shared/types";

async function updateTheme(settings: Config<Settings>, theme: Settings['theme']) {
    nativeTheme.themeSource = theme;
    settings.set("theme", theme);
    await settings.save();
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
