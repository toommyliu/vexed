import type { BrowserWindow } from "electron";

export function isWindowUsable(window: BrowserWindow) {
  return !window.isDestroyed() && !window.webContents.isDestroyed();
}
