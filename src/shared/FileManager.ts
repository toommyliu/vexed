import { join, dirname } from "path";
import {
  readFile as atomicReadFile,
  writeFile as atomicWriteFile,
} from "atomically";
import {
  ensureDir,
  pathExists,
  appendFile as fsExtraAppendFile,
} from "fs-extra";
import { Config } from "../renderer/game/botting/util/Config";
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_FAST_TRAVELS,
  DEFAULT_HOTKEYS,
  DEFAULT_SETTINGS,
  DOCUMENTS_PATH,
} from "./constants";
import type { HotkeyConfig } from "./types";

export class FileManager {
  private static initialized = false;

  public static basePath = DOCUMENTS_PATH;

  public static scriptsDir = join(FileManager.basePath, "scripts");

  public static get settingsPath() {
    return join(FileManager.basePath, "settings.json");
  }

  public static get fastTravelsPath() {
    return join(FileManager.basePath, "fast-travels.json");
  }

  public static get accountsPath() {
    return join(FileManager.basePath, "accounts.json");
  }

  public static get hotkeysPath() {
    return join(FileManager.basePath, "hotkeys.txt");
  }

  public static get storagePath() {
    return join(FileManager.basePath, "storage");
  }

  private static async ensureJsonFile<T>(path: string, json: T): Promise<void> {
    try {
      const exists = await pathExists(path);
      if (!exists) {
        await FileManager.writeJson(path, json);
      }
    } catch (error) {
      await FileManager.writeJson(path, json);
      throw error;
    }
  }

  /**
   * Creates necessary directories and files for the application.
   */
  public static async initialize(): Promise<void> {
    if (FileManager.initialized) {
      return;
    }

    FileManager.initialized = true;

    await Promise.all([
      ensureDir(FileManager.basePath),
      ensureDir(FileManager.scriptsDir),
      ensureDir(FileManager.storagePath),
    ]);

    await Promise.all([
      FileManager.ensureJsonFile(FileManager.settingsPath, DEFAULT_SETTINGS),
      FileManager.ensureJsonFile(
        FileManager.fastTravelsPath,
        DEFAULT_FAST_TRAVELS,
      ),
      FileManager.ensureJsonFile(FileManager.accountsPath, DEFAULT_ACCOUNTS),
    ]);

    if (!(await pathExists(FileManager.hotkeysPath))) {
      const config = new Config<HotkeyConfig>("hotkeys");
      config.loadFromObject(DEFAULT_HOTKEYS);
      await config.save();
    }
  }

  /**
   * Reads the contents of a file.
   *
   * @param path - The path to the file to read.
   * @returns The contents of the file as a string, or null if the file does not exist or an error occurs.
   */
  public static async readFile(path: string): Promise<string | null> {
    try {
      if (!(await pathExists(path))) {
        return null;
      }

      return await atomicReadFile(path, "utf8");
    } catch {
      return null;
    }
  }

  /**
   * Writes data to a file.
   *
   * @param path - The path to the file to write.
   * @param data - The data to write to the file.
   */
  public static async writeFile(path: string, data: string): Promise<void> {
    await ensureDir(dirname(path));
    await atomicWriteFile(path, data, "utf8");
  }

  public static async appendFile(path: string, data: string): Promise<void> {
    await ensureDir(dirname(path));
    await fsExtraAppendFile(path, data, "utf8");
  }

  /**
   * Reads a JSON file and parses its contents.
   *
   * @param path - The path to the JSON file to read.
   * @returns The parsed JSON data as an object, or null if the file does not exist or an error occurs.
   */
  public static async readJson<T>(path: string): Promise<T | null> {
    try {
      const data = await atomicReadFile(path, "utf8");
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Writes data to a JSON file.
   *
   * @param path - The path to the JSON file to write.
   * @param data  - The data to write to the JSON file.
   */
  public static async writeJson(path: string, data: unknown): Promise<void> {
    await atomicWriteFile(path, JSON.stringify(data, null, 4), "utf8");
  }
}
