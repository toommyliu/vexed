import { join } from "path";
import os from "os";
import { app } from "electron";

//TODO: refactor
export const BRAND = app.getName();

export const DOCUMENTS_PATH = join(os.homedir(), "Documents", BRAND);

export const FAST_TRAVELS_PATH = join(DOCUMENTS_PATH, "fast-travels.json");
