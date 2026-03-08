import { dirname, join } from "path";
import process from "process";
import { app } from "electron";

// export these ASAP
export { BRAND, DOCUMENTS_PATH, FAST_TRAVELS_PATH } from "./paths";

export const IS_WINDOWS = process.platform === "win32";
export const IS_MAC = process.platform === "darwin";
export const IS_LINUX = process.platform === "linux";

export const PLATFORM = {
  isWindows: IS_WINDOWS,
  isMac: IS_MAC,
  isLinux: IS_LINUX,
};

export const IS_PACKAGED = app.isPackaged;

export function getAssetPath() {
  if (IS_PACKAGED) {
    if (IS_WINDOWS) {
      return join(dirname(app.getPath("exe")), "assets");
    }

    if (IS_LINUX) {
      return join(dirname(app.getPath("exe")), "assets");
    }

    return join(app.getAppPath(), "assets");
  }

  return join(__dirname, "../../../assets");
}

export const DIST_PATH = IS_PACKAGED
  ? join(app.getAppPath(), "dist")
  : join(process.cwd(), "dist");
