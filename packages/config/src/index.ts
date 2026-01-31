import { resolve } from "path";
import { readJson, writeJson, pathExists, FsError } from "@vexed/fs";
import { Result } from "better-result";

export interface ConfigOptions<T> {
  configName?: string;
  cwd?: string;
  defaults?: T;
}

export type ConfigError = FsError;

export class Config<T extends object | unknown[]> {
  private configName: string;
  private cwd: string;
  private defaults: T;
  private path: string;
  private _cache: T | null = null;

  /**
   * Creates a new Config instance and loads it from disk.
   */
  static async create<T extends object | unknown[]>(
    options: ConfigOptions<T> = {},
  ): Promise<Result<Config<T>, ConfigError>> {
    const config = new Config(options);
    const result = await config.load();
    if (result.isErr()) {
      return Result.err(result.error);
    }
    return Result.ok(config);
  }

  constructor(options: ConfigOptions<T> = {}) {
    this.configName = options.configName || "config";
    this.cwd = options.cwd || process.cwd();
    this.defaults = options.defaults || ({} as T);
    this.path = resolve(this.cwd, `${this.configName}.json`);
  }

  /*
   * Loads the config from disk.
   */
  async load(): Promise<Result<T, ConfigError>> {
    if (this._cache !== null) return Result.ok(this._cache);

    return Result.gen(
      async function* (this: Config<T>) {
        const exists = yield* Result.await(pathExists(this.path));

        if (exists) {
          const loaded = yield* Result.await(readJson<T>(this.path));

          // arrays don't require deep-merge
          if (Array.isArray(this.defaults)) {
            this._cache = loaded;
          } else {
            this._cache = this._deepMerge(
              this.defaults as object,
              loaded as object,
            ) as T;
            // any defaults added?
            if (JSON.stringify(this._cache) !== JSON.stringify(loaded)) {
              yield* Result.await(writeJson(this.path, this._cache!));
            }
          }
        } else {
          this._cache = this._cloneDefaults();
          yield* Result.await(writeJson(this.path, this._cache!));
        }

        return Result.ok(this._cache!);
      }.bind(this),
    );
  }

  private _cloneDefaults(): T {
    return (
      Array.isArray(this.defaults) ? [...this.defaults] : { ...this.defaults }
    ) as T;
  }

  async save(): Promise<Result<void, ConfigError>> {
    if (this._cache === null) {
      this._cache = this._cloneDefaults();
    }

    return writeJson(this.path, this._cache);
  }

  /**
   * Set a value and immediately persist to disk.
   */
  async setAndSave(
    key: string | Partial<T>,
    value?: any,
  ): Promise<Result<void, ConfigError>> {
    this.set(key as any, value);
    return this.save();
  }

  /**
   * Reload configuration from disk, discarding any in-memory cache.
   */
  async reload(): Promise<Result<T, ConfigError>> {
    this._cache = null;
    return this.load();
  }

  get(): T;
  get<K extends string>(key: K, defaultValue?: any): any;
  get(key?: string, defaultValue?: any): any {
    const store =
      this._cache !== null
        ? this._cache
        : (this._cache = this._cloneDefaults());

    if (key === undefined) {
      return store;
    }

    if (key.includes(".")) {
      return this._getNestedValue(store, key, defaultValue);
    }

    return (store as any)[key] !== undefined
      ? (store as any)[key]
      : defaultValue;
  }

  /**
   * Get a string value from the config.
   */
  getString(key: string, defaultValue = ""): string {
    const val = this.get(key, defaultValue);
    return typeof val === "string" ? val : defaultValue;
  }

  /**
   * Get a number value from the config.
   */
  getNumber(key: string, defaultValue = 0): number {
    const val = this.get(key, defaultValue);
    return typeof val === "number" ? val : defaultValue;
  }

  /**
   * Get a boolean value from the config.
   */
  getBoolean(key: string, defaultValue = false): boolean {
    const val = this.get(key, defaultValue);
    return typeof val === "boolean" ? val : defaultValue;
  }

  /**
   * Set a value in the config.
   */
  set(key: Partial<T>): void;
  set(key: string, value: any): void;
  set(key: string | Partial<T>, value?: any): void {
    if (typeof key === "object" && key !== null) {
      const store =
        this._cache !== null
          ? this._cache
          : (this._cache = this._cloneDefaults());
      Object.assign(store, key);
      this._cache = store;
      return;
    }

    const store =
      this._cache !== null
        ? this._cache
        : (this._cache = this._cloneDefaults());

    if (key.includes(".")) {
      this._setNestedValue(store, key, value);
    } else {
      (store as any)[key] = value;
    }

    this._cache = store;
  }

  /**
   * Check if a key exists in the config.
   */
  has(key: string): boolean {
    if (this._cache === null) return false;

    if (key.includes(".")) {
      return this._hasNestedValue(this._cache, key);
    }

    return key in this._cache;
  }

  /**
   * Delete a key from the config.
   */
  delete(key: string): void {
    const store =
      this._cache !== null
        ? this._cache
        : (this._cache = this._cloneDefaults());

    if (key.includes(".")) {
      this._deleteNestedValue(store, key);
    } else {
      delete (store as any)[key];
    }

    this._cache = store;
  }

  /**
   * Clear the config.
   */
  clear(): void {
    this._cache = this._cloneDefaults();
  }

  /**
   * Reset the config.
   */
  reset(): null {
    this._cache = null;
    return null;
  }

  /**
   * Deep merge two objects. Source values take precedence.
   */
  private _deepMerge(target: object, source: object): object {
    const result: any = { ...target };
    for (const key of Object.keys(source)) {
      const sourceVal = (source as any)[key];
      const targetVal = (target as any)[key];

      if (
        sourceVal !== null &&
        typeof sourceVal === "object" &&
        !Array.isArray(sourceVal) &&
        targetVal !== null &&
        typeof targetVal === "object" &&
        !Array.isArray(targetVal)
      ) {
        result[key] = this._deepMerge(targetVal, sourceVal);
      } else {
        result[key] = sourceVal;
      }
    }

    return result;
  }

  private _getNestedValue(obj: any, path: string, defaultValue: any): any {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }

    return current;
  }

  private _setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (
        !(key in current) ||
        typeof current[key] !== "object" ||
        current[key] === null
      ) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  private _hasNestedValue(obj: any, path: string): boolean {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  private _deleteNestedValue(obj: any, path: string): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return;
      }
      current = current[key];
    }

    delete current[lastKey];
  }
}

export default Config;
