import { basename, join } from "path";
import { FileManager } from "../../../../shared/FileManager";

type ConfigValue = boolean | number | string;

type ConfigNode = {
  [key: string]: ConfigNode | ConfigValue;
};

// Inspired by https://github.com/calamity-inc/Soup/blob/senpai/docs/user/cat.md

export class Config {
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
    const cleanFileName = filePath.endsWith(".txt")
      ? filePath.slice(0, -4)
      : filePath;

    this.#filePath = join(FileManager.basePath, `${cleanFileName}.txt`);
    this.fileName = basename(this.#filePath, ".txt");

    console.log(`Config file path: ${this.#filePath}`);
    console.log(`Clean file name: ${this.fileName}`);
  }

  /**
   * Loads and parses the config file at the specified path.
   */
  public async load(): Promise<void> {
    const fileContent = await FileManager.readFile(this.#filePath);
    if (!fileContent) {
      throw new Error(`Failed to read config file at ${this.#filePath}`);
    }

    this.#parseConfig(fileContent);
  }

  /**
   * Gets a value from the config.
   *
   * @param key - The key to look up. Supports dot notation.
   * @returns The value at the specified key, or undefined if not found.
   */
  public get<T extends ConfigValue = ConfigValue>(
    key: string,
    defaultValue?: T,
  ): T | undefined {
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

      current = (current as ConfigNode)[part]!;
    }

    return (current as T) ?? defaultValue;
  }

  /**
   * Returns a copy of the entire config object.
   *
   * @returns A deep copy of the config data
   */
  public getAll(): ConfigNode {
    return this.#rootNode;
  }

  /**
   * Sets a value in the config.
   *
   * @param key - The key to set. Supports dot notation.
   * @param value - The value to set (primitive or nested object)
   */
  public set(key: string, value: ConfigNode | ConfigValue): void {
    if (!key) {
      throw new Error("Key cannot be empty");
    }

    const parts = key.split(".");
    const lastPart = parts.pop()!;
    let current = this.#rootNode;

    // Create nested objects if they don't exist
    for (const part of parts) {
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }

      current = current[part] as ConfigNode;
    }

    if (typeof value === "object" && value !== null) {
      // Handle nested objects with deep copy
      current[lastPart] = JSON.parse(JSON.stringify(value));
    } else {
      // Handle primitive values
      current[lastPart] = value;
    }
  }

  /**
   * Deletes a value from the config.
   *
   * @param key - The key to delete. Supports dot notation.
   * @returns true if the key was deleted, false if it didn't exist
   */
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

    // eslint-disable-next-line prefer-object-has-own
    if (Object.prototype.hasOwnProperty.call(current, lastPart)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete current[lastPart];
      return true;
    }

    return false;
  }

  /**
   * Saves the config to the file.
   */
  public async save(): Promise<void> {
    const content = this.#serializeConfig(this.#rootNode);
    await FileManager.writeFile(this.#filePath, content);
  }

  /**
   * Serializes the config object back to string format.
   *
   * @param node - The node to serialize
   * @param indent - The current indentation level
   * @returns The serialized config string
   */
  #serializeConfig(node: ConfigNode, indent = 0): string {
    let result = "";

    for (const [key, value] of Object.entries(node)) {
      const tabs = "\t".repeat(indent);

      if (typeof value === "object" && value !== null) {
        // Handle nested nodes
        result += `${tabs}${key}\n`;
        result += this.#serializeConfig(value, indent + 1);
      } else {
        // Handle leaf nodes (key-value pairs)
        result += `${tabs}${key}: ${value}\n`;
      }
    }

    return result;
  }

  /**
   * Parses the config file content into a structured object.
   *
   * @param content - The content of the config file as a string
   */
  #parseConfig(content: string) {
    const lines = content.split("\n");
    const root: ConfigNode = {};
    const stack: [ConfigNode, number][] = [[root, -1]];

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) {
        continue;
      }

      // Skip comments
      if (line.trim().startsWith("#")) {
        continue;
      }

      const indent = this.getIndentLevel(line);
      const trimmedLine = line.trim();

      // Pop stack until we find the parent node
      while (
        stack.length > 1 &&
        (stack[stack.length - 1] as [ConfigNode, number])[1] >= indent
      ) {
        stack.pop();
      }

      const currentParent = (
        stack[stack.length - 1] as [ConfigNode, number]
      )?.[0];

      if (!currentParent) {
        throw new Error("Invalid config structure: parent node not found");
      }

      if (trimmedLine.includes(":")) {
        // Key-value pair
        const [key, value] = trimmedLine.split(":").map((part) => part.trim());
        if (key && value !== undefined) {
          currentParent[key] = this.parseValue(value);
        }
      } else {
        // Node without value
        const newNode: ConfigNode = {};
        currentParent[trimmedLine] = newNode;
        stack.push([newNode, indent]);
      }
    }

    this.#rootNode = root;
  }

  /**
   * Calculates the indentation level of a line by counting leading tabs.
   *
   * @param line - The line to check.
   * @returns The number of tab characters at the start of the line.
   */
  private getIndentLevel(line: string): number {
    let count = 0;

    for (const char of line) {
      if (char === "\t") {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  /**
   * Parses a string value from the config file into the appropriate type.
   * Values should only be one of the following types: number, boolean, or string.
   *
   * @param value - The string value to parse
   * @returns The parsed value as a number, boolean, or string
   */
  private parseValue(value: string): ConfigValue {
    // Try parsing as number
    if (!Number.isNaN(Number(value))) {
      return Number(value);
    }

    // Try parsing as boolean
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Return as string
    return value;
  }
}
