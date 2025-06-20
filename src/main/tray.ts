import { Menu, Tray, app, dialog, nativeImage, session } from "electron";
import fs from "fs-extra";
import { join, sep } from "path";
import process from "process";
import { totalist } from "totalist";
import { BRAND } from "../shared/constants";
import { createAccountManager, createGame } from "./windows";

let tray: Tray | null = null;

const deleteDirectory = async (dirPath: string) => {
  if (!(await fs.pathExists(dirPath))) {
    console.log(`Directory does not exist: ${dirPath}`);
    return;
  }

  try {
    const dirs = new Set<string>();
    const files = new Set<string>();

    await totalist(dirPath, (_name, absPath, stats) => {
      if (stats.isFile()) files.add(absPath);
      else if (stats.isDirectory()) dirs.add(absPath);
    });

    // Delete files first
    for (const filePath of files) await fs.unlink(filePath);

    // Sort the directories by depth (a.k.a deepest path first)
    const sortedDirs = Array.from(dirs).sort(
      (a, b) => b.split(sep).length - a.split(sep).length,
    );

    // Delete directories
    for (const dir of sortedDirs) await fs.rmdir(dir);

    // Finally, delete the root directory
    await fs.rmdir(dirPath);
  } catch {}
};

const contextMenu = Menu.buildFromTemplate([
  {
    label: "Open Account Manager",
    click: () => void createAccountManager(),
  },
  {
    label: "Open Game",
    click: () => void createGame(),
  },
  { type: "separator" },
  {
    label: "Clear App Cache",
    click: () => {
      session.defaultSession?.clearStorageData({
        storages: ["cookies", "appcache"],
      });
    },
  },
  {
    label: "Clear Flash Cache",
    click: async () => {
      const flashPath = join(
        app.getPath("userData"),
        "Pepper Data",
        "Shockwave Flash",
        "WritableRoot",
      );

      await deleteDirectory(flashPath);

      // A restart is required because we'd have to re-register the flash plugin
      // So having the user restart the app is the easiest way to handle this.

      await dialog.showMessageBox({
        message:
          "Flash cache cleared successfully. An app restart is required.",
        type: "info",
      });
    },
  },
  { type: "separator" },
  {
    label: "Quit",
    click: () => {
      app.exit();
    },
  },
]);

app.on("ready", () => {
  // menu bar on mac, tray icon on windows
  const path = join(__dirname, "../../assets/tray.png");
  const icon = nativeImage.createFromPath(path);

  tray = new Tray(icon);
  tray.setToolTip(BRAND);
  tray.setContextMenu(contextMenu);

  if (process.platform === "darwin") {
    app.dock.setIcon(
      nativeImage.createFromPath(join(__dirname, "../../assets/icon.png")),
    );
  }
});

app.on("before-quit", () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
