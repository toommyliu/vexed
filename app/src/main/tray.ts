import { join } from "path";
import { app, Menu, nativeImage, Tray } from "electron";
import { getAssetPath, BRAND, IS_MAC } from "./constants";
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
  const assetPath = getAssetPath();
  // menu bar on mac, tray icon on windows
  const path = join(assetPath, "tray.png");
  const icon = nativeImage.createFromPath(path);

  tray = new Tray(icon);
  tray.setToolTip(BRAND);
  tray.setContextMenu(contextMenu);

  if (IS_MAC)
    app.dock.setIcon(nativeImage.createFromPath(join(assetPath, "icon.png")));
});

app.on("before-quit", () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
