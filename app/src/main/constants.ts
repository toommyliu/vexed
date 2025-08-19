import { join } from "path";
import { app } from "electron";

export const IS_PACKAGED = app.isPackaged;

export const ASSET_PATH = IS_PACKAGED
  ? join(app.getAppPath(), "assets")
  : join(__dirname, "../../../assets");

export const DIST_PATH = IS_PACKAGED
  ? join(app.getAppPath(), "dist")
  : join(__dirname, "../../dist");
