import type { BrowserWindow } from "electron";

export function isWindowUsable(window: BrowserWindow | null) {
  return !window?.isDestroyed() && !window?.webContents.isDestroyed();
}
