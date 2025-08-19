import { join } from "path";
import { app } from "electron";

export const ASSET_PATH = app.isPackaged
  ? join(app.getAppPath(), "assets")
  : join(__dirname, "../../../assets");

export const DIST_PATH = app.isPackaged
  ? join(app.getAppPath(), "dist")
  : join(__dirname, "../../dist");
