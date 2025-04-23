import { join } from "path";
import { FileManager } from "../../../../common/FileManager";

// Key:Value store
export class Config {
  /**
   * The path to the config file.
   */
  private readonly filePath: string;

  /**
   * The data stored in the config.
   */
  private data: Record<string, string> = {};

  public constructor(filePath: string) {
    const cleanFilePath = filePath.endsWith(".txt")
      ? filePath.slice(0, -4)
      : filePath;

    this.filePath = join(FileManager.storagePath, `${cleanFilePath}.txt`);
  }

  /**
   * Get a value from the config.
   *
   * @param key - The key to get the value for.
   * @param defaultValue -  The default value to return if the key doesn't exist.
   * @returns The value for the key, or the default value.
   */
  public get(key: string, defaultValue: string = ""): string {
    return this.data[key] ?? defaultValue;
  }

  /**
   * Set a value in the config.
   *
   * @param key - The key to set.
   * @param value - The value to set.
   */
  public set(key: string, value: string): void {
    this.data[key] = value;
  }

  /**
   * Save the config file to disk.
   */
  public async save(): Promise<void> {
    const lines = Object.entries(this.data)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    await FileManager.writeFile(this.filePath, lines);
  }

  public async load(): Promise<void> {
    try {
      const data = await FileManager.readFile(this.filePath);
      if (!data) return;

      const lines = data.split("\n");
      for (const line of lines) {
        // eslint-disable-next-line prefer-named-capture-group
        const match = /^(.*?[^\\]):(.*)$/.exec(line);
        if (match) {
          const key = match[1]?.trim()?.replace(/\\:/g, ":");
          const value = match[2]?.trim();

          if (key && value) {
            this.data[key] = value;
          }
        }
      }
    } catch {}
  }
}
