import { join, dirname } from "path";
import process from "process";
import { app } from "electron";
import log from "electron-log";
import { IS_WINDOWS } from "../shared/constants";

export const IS_PACKAGED = app.isPackaged;

export const ASSET_PATH = IS_PACKAGED
  ? IS_WINDOWS
    ? join(dirname(app.getPath("exe")), "assets")
    : join(app.getAppPath(), "assets")
  : join(__dirname, "../../../assets");

export const DIST_PATH = IS_PACKAGED
  ? join(app.getAppPath(), "dist")
  : join(process.cwd(), "dist");

export const logger = log.scope("main");
