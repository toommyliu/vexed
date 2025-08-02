import { basename, join } from "path";
import { FileManager } from "../../../../shared/FileManager";

type ConfigValue = boolean | number | string;

type ConfigNode = {
  [key: string]: ConfigNode | ConfigValue;
};

type NestedKeyOf<T> = {
  [K in keyof T]: K extends string
    ? T[K] extends ConfigValue | undefined
      ? K
      : T[K] extends Record<string, any> | undefined
        ? K | `${K}.${NestedKeyOf<NonNullable<T[K]>>}`
        : K
    : never;
}[keyof T];

type GetNestedType<T, K extends string> = K extends keyof T
  ? T[K]
  : K extends `${infer First}.${infer Rest}`
    ? First extends keyof T
      ? T[First] extends Record<string, any> | undefined
        ? GetNestedType<NonNullable<T[First]>, Rest>
        : never
      : never
    : never;

export class Config<T extends Record<string, any> = ConfigNode> {
  /**
   * The file path of the config file.
   */
  readonly #filePath: string;

  /**
   * The file name of the config file.
   */
  public readonly fileName: string;

  /**
   * The root node of the config file.
   */
  #rootNode: ConfigNode = {};

  public constructor(filePath: string) {
    const cleanFileName = filePath.endsWith(".json")
      ? filePath.slice(0, -5)
      : filePath;

    this.#filePath = join(FileManager.basePath, `${cleanFileName}.json`);
    this.fileName = basename(this.#filePath, ".json");
  }

  /**
   * Loads and parses the config file at the specified path.
   */
  public async load(): Promise<void> {
    const fileContent = await FileManager.readFile(this.#filePath);
    if (!fileContent) {
      throw new Error(`Failed to read config file at ${this.#filePath}`);
    }

    try {
      this.#rootNode = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to parse JSON config: ${error}`);
    }
  }

  /**
   * Gets a value from the config.
   *
   * @param key - The key to look up. Supports dot notation.
   * @returns The value at the specified key, or undefined if not found.
   */
  public get<K extends NestedKeyOf<T>>(key: K): GetNestedType<T, K> | undefined;
  public get<K extends NestedKeyOf<T>, D>(
    key: K,
    defaultValue: D,
  ): D | GetNestedType<T, K>;
  public get(key: string, defaultValue?: any): any {
    if (!key) {
      throw new Error("Key cannot be empty");
    }

    const parts = key.split(".");
    let current: ConfigNode | ConfigValue = this.#rootNode;

    for (const part of parts) {
      if (
        current === undefined ||
        current === null ||
        typeof current !== "object"
      ) {
        return defaultValue;
      }

      const next: ConfigNode | ConfigValue | undefined = (
        current as ConfigNode
      )[part];

      if (next === undefined) {
        return defaultValue;
      }

      current = next;
    }

    return current ?? defaultValue;
  }

  /**
   * Returns a copy of the entire config object.
   *
   * @returns A deep copy of the config data
   */
  public getAll(): T {
    return JSON.parse(JSON.stringify(this.#rootNode)) as T;
  }

  /**
   * Sets a value in the config.
   *
   * @param key - The key to set. Supports dot notation.
   * @param value - The value to set (primitive or nested object)
   */
  public set<K extends NestedKeyOf<T>>(
    key: K,
    value: GetNestedType<T, K>,
  ): void;
  public set(key: string, value: ConfigNode | ConfigValue): void;
  public set(key: string, value: ConfigNode | ConfigValue): void {
    if (!key) {
      throw new Error("Key cannot be empty");
    }

    const parts = key.split(".");
    const lastPart = parts.pop()!;
    let current = this.#rootNode;

    for (const part of parts) {
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }

      current = current[part] as ConfigNode;
    }

    if (typeof value === "object" && value !== null) {
      current[lastPart] = JSON.parse(JSON.stringify(value));
    } else {
      current[lastPart] = value;
    }
  }

  /**
   * Deletes a value from the config.
   *
   * @param key - The key to delete. Supports dot notation.
   * @returns true if the key was deleted, false if it didn't exist
   */
  public delete<K extends NestedKeyOf<T>>(key: K): boolean;
  public delete(key: string): boolean;
  public delete(key: string): boolean {
    if (!key) {
      throw new Error("Key cannot be empty");
    }

    const parts = key.split(".");
    const lastPart = parts.pop()!;
    let current = this.#rootNode;

    for (const part of parts) {
      if (!(part in current) || typeof current[part] !== "object") {
        return false;
      }

      current = current[part] as ConfigNode;
    }

    if (Object.hasOwn(current, lastPart)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete current[lastPart];
      return true;
    }

    return false;
  }

  /**
   * Loads an object into the config, replacing the current config data.
   *
   * @param data - The object to load into the config
   */
  public loadFromObject(data: T): void {
    try {
      this.#rootNode = JSON.parse(JSON.stringify(data)) as ConfigNode;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
    }
  }

  /**
   * Saves the config to the file as JSON.
   */
  public async save(): Promise<void> {
    const content = JSON.stringify(this.#rootNode, null, 2);
    await FileManager.writeFile(this.#filePath, content);
  }
}
