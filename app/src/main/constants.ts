import { join } from "path";
import { app } from "electron";

export const IS_PACKAGED = app.isPackaged;

export const ASSET_PATH = IS_PACKAGED
  ? IS_WINDOWS
    ? join(dirname(app.getPath("exe")), "assets")
    : join(app.getAppPath(), "assets")
  : join(__dirname, "../../../assets");

export const DIST_PATH = IS_PACKAGED
  ? join(app.getAppPath(), "dist")
  : join(process.cwd(), "dist");
