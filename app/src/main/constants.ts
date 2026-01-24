import { join, dirname } from "path";
import process from "process";
import { app } from "electron";

export const BRAND = app.getName();

export const IS_WINDOWS = process.platform === "win32";
export const IS_MAC = process.platform === "darwin";
export const IS_LINUX = process.platform === "linux";

export const IS_PACKAGED = app.isPackaged;

export const ASSET_PATH = IS_PACKAGED
  ? IS_WINDOWS
    ? join(dirname(app.getPath("exe")), "assets")
    : join(app.getAppPath(), "assets")
  : join(__dirname, "../../../assets");

export const DIST_PATH = IS_PACKAGED
  ? join(app.getAppPath(), "dist")
  : join(process.cwd(), "dist");
