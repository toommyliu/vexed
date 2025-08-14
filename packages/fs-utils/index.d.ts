/**
 * Ensures a directory exists, creating it if necessary.
 * @param path - The directory path to ensure exists.
 */
export function ensureDir(path: string): Promise<void>;

/**
 * Checks if a file or directory exists.
 * @param path - The path to check.
 * @returns True if the path exists, false otherwise.
 */
export function pathExists(path: string): Promise<boolean>;

/**
 * Reads the contents of a file.
 * @param path - The path to the file to read.
 * @returns The contents of the file.
 */
export function readFile(path: string): Promise<string>;

/**
 * Writes data to a file, ensuring the directory exists.
 * @param path - The path to the file to write.
 * @param data - The data to write to the file.
 */
export function writeFile(path: string, data: string): Promise<void>;

/**
 * Appends data to a file, ensuring the directory exists.
 * @param path - The path to the file to append to.
 * @param data - The data to append to the file.
 */
export function appendFile(path: string, data: string): Promise<void>;

/**
 * Reads and parses a JSON file.
 * @param path - The path to the JSON file to read.
 * @returns The parsed JSON data.
 */
export function readJson<T = any>(path: string): Promise<T>;

/**
 * Writes data to a JSON file with pretty formatting.
 * @param path - The path to the JSON file to write.
 * @param data - The data to write to the JSON file.
 */
export function writeJson(path: string, data: unknown): Promise<void>;

/**
 * Ensures a file exists with optional default content.
 * @param path - The path to the file.
 * @param defaultContent - The default content to write if the file doesn't exist.
 */
export function ensureFile(
  path: string,
  defaultContent?: string,
): Promise<void>;

/**
 * Ensures a JSON file exists with default content if it doesn't exist.
 * @param path - The path to the JSON file.
 * @param defaultContent - The default content to write if the file doesn't exist.
 */
export function ensureJsonFile<T = any>(
  path: string,
  defaultContent: T,
): Promise<void>;

/**
 * Deletes a file if it exists.
 * @param path - The path to the file to delete.
 */
export function deleteFile(path: string): Promise<void>;

/**
 * Options for recursive directory reading operations.
 */
export interface ReadDirOptions {
  /**
   * Filter function to determine which files to include.
   * @param name - The file/directory name.
   * @param absPath - The absolute path to the file/directory.
   * @param stats - The fs.Stats object for the file/directory.
   * @returns True to include the file, false to exclude it.
   */
  filter?: (
    name: string,
    absPath: string,
    stats: import("fs").Stats,
  ) => boolean;
  /**
   * Whether to include only files (not directories).
   * @default true
   */
  filesOnly?: boolean;
}

/**
 * Recursively reads all files in a directory and its subdirectories.
 * @param dirPath - The directory path to read recursively.
 * @param options - Options for filtering and processing.
 * @returns Array of absolute file paths.
 */
export function readDirRecursive(
  dirPath: string,
  options?: ReadDirOptions,
): Promise<string[]>;
