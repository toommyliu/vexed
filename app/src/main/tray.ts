import { join } from "path";
import { app, Menu, nativeImage, Tray } from "electron";
import { IS_MAC } from "../shared/constants";
import { ASSET_PATH, BRAND } from "./constants";
import { windowsService } from "./services/windows";

// https://www.electronjs.org/docs/latest/faq#my-apps-tray-disappeared-after-a-few-minutes
let tray: Tray | null = null;

const contextMenu = Menu.buildFromTemplate([
  {
    label: "Open Account Manager",
    click: () => void windowsService.manager(),
  },
  {
    label: "Open Game",
    click: () => void windowsService.game(),
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
  const path = join(ASSET_PATH, "tray.png");
  const icon = nativeImage.createFromPath(path);

  tray = new Tray(icon);
  tray.setToolTip(BRAND);
  tray.setContextMenu(contextMenu);

  if (IS_MAC)
    app.dock.setIcon(nativeImage.createFromPath(join(ASSET_PATH, "icon.png")));
});

app.on("before-quit", () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
