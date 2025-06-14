import { join } from "path";
import process from "process";
import { Menu, Tray, app, nativeImage } from "electron";
import { BRAND } from "../shared/constants";
import { createAccountManager, createGame } from "./windows";

let tray: Tray | null = null;

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
