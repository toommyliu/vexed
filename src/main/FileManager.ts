import { join } from "path";
import fs from "fs-extra";
import {
  DOCUMENTS_PATH,
  DEFAULT_ACCOUNTS,
  DEFAULT_FAST_TRAVELS,
  DEFAULT_SETTINGS,
} from "../common/constants";

// TODO: refactor

export class FileManager {
  private static instance: FileManager;

  public basePath = DOCUMENTS_PATH;

  public scriptsDir = join(this.basePath, "scripts");

  public get settingsPath() {
    return join(this.basePath, "settings.json");
  }

  public get fastTravelsPath() {
    return join(this.basePath, "fast-travels.json");
  }

  public get accountsPath() {
    return join(this.basePath, "accounts.json");
  }

  public get defaultSettings() {
    return {
      launchMode: "game",
    };
  }

  public get defaultFastTravels() {
    return DEFAULT_FAST_TRAVELS;
  }

  public get defaultAccounts() {
    return DEFAULT_ACCOUNTS;
  }

  public static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }

    return FileManager.instance;
  }

  private async ensureJsonFile<T>(path: string, json: T): Promise<void> {
    try {
      const exists = await fs.pathExists(path);
      if (!exists) {
        await this.writeJson(path, json);
      }
    } catch (error) {
      await this.writeJson(path, json);
      throw error;
    }
  }

  public async initialize(): Promise<void> {
    await Promise.all([
      fs.ensureDir(this.basePath),
      fs.ensureDir(this.scriptsDir),
    ]);

    await Promise.all([
      this.ensureJsonFile(this.settingsPath, DEFAULT_SETTINGS),
      this.ensureJsonFile(this.fastTravelsPath, DEFAULT_FAST_TRAVELS),
      this.ensureJsonFile(this.accountsPath, DEFAULT_ACCOUNTS),
    ]);
  }

  public async readJson<T>(path: string): Promise<T | null> {
    try {
      const data = await fs.readJson(path);
      return data as T;
    } catch (error) {
      console.log(`Error reading json file at ${path}:`, error);
      return null;
    }
  }

  public async writeJson(path: string, data: unknown): Promise<void> {
    return fs.writeJson(path, data, { spaces: 4 });
  }
}

export type Settings = {
  /**
   * The launch mode of the application.
   */
  launchMode: "game" | "manager";
};

export type Location = {
  /**
   * The cell to jump to. Defaults to "Enter".
   */
  cell?: string;
  /**
   * The map name to join.
   */
  map: string;
  /**
   * The name of the location.
   */
  name: string;
  /**
   * The pad to jump to. Defaults to "Spawn".
   */
  pad?: string;
};
