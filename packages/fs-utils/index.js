const { dirname } = require("path");
const {
  readFile: atomicReadFile,
  writeFile: atomicWriteFile,
} = require("atomically");
const {
  ensureDir: fsExtraEnsureDir,
  pathExists: fsExtraPathExists,
  appendFile: fsExtraAppendFile,
  ensureFile: fsExtraEnsureFile,
} = require("fs-extra");
const { totalist } = require("totalist");
const fs = require("fs").promises;

const { unlink, stat, rm } = fs;

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} path - The directory path to ensure exists.
 * @returns {Promise<void>}
 * @throws {Error} When path is invalid or permission denied
 */
async function ensureDir(path) {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  await fsExtraEnsureDir(path);
}

/**
 * Checks if a file or directory exists.
 * @param {string} path - The path to check.
 * @returns {Promise<boolean>} True if the path exists, false otherwise.
 * @throws {Error} When path is invalid
 */
async function pathExists(path) {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  return fsExtraPathExists(path);
}

/**
 * Reads the contents of a file.
 * @param {string} path - The path to the file to read.
 * @param {string} [encoding='utf8'] - The encoding to use when reading the file.
 * @returns {Promise<string>} The contents of the file.
 * @throws {Error} When file doesn't exist, permission denied, or path is invalid
 */
async function readFile(path, encoding = "utf8") {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  return atomicReadFile(path, encoding);
}

/**
 * Writes data to a file, ensuring the directory exists.
 * @param {string} path - The path to the file to write.
 * @param {string|Buffer} data - The data to write to the file.
 * @param {string} [encoding='utf8'] - The encoding to use when writing the file.
 * @returns {Promise<void>}
 * @throws {Error} When path is invalid, permission denied, or write fails
 */
async function writeFile(path, data, encoding = "utf8") {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  if (data === null || data === undefined) {
    throw new Error("Data cannot be null or undefined");
  }

  await fsExtraEnsureDir(dirname(path));
  await atomicWriteFile(path, data, encoding);
}

/**
 * Appends data to a file, ensuring the directory exists.
 * @param {string} path - The path to the file to append to.
 * @param {string|Buffer} data - The data to append to the file.
 * @param {string} [encoding='utf8'] - The encoding to use when appending to the file.
 * @returns {Promise<void>}
 * @throws {Error} When path is invalid, permission denied, or append fails
 */
async function appendFile(path, data, encoding = "utf8") {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  if (data === null || data === undefined) {
    throw new Error("Data cannot be null or undefined");
  }

  await fsExtraEnsureDir(dirname(path));
  await fsExtraAppendFile(path, data, encoding);
}

/**
 * Reads and parses a JSON file.
 * @param {string} path - The path to the JSON file to read.
 * @returns {Promise<any>} The parsed JSON data.
 * @throws {Error} When file doesn't exist, permission denied, path is invalid, or JSON is malformed
 */
async function readJson(path) {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  try {
    const data = await atomicReadFile(path, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(`JSON file not found: ${path}`);
    }

    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${path} - ${err.message}`);
    }

    throw err;
  }
}

/**
 * Writes data to a JSON file with customizable formatting.
 * @param {string} path - The path to the JSON file to write.
 * @param {any} data - The data to write to the JSON file.
 * @param {number} [indent=2] - Number of spaces to use for indentation.
 * @returns {Promise<void>}
 * @throws {Error} When path is invalid, data is not serializable, or write fails
 */
async function writeJson(path, data, indent = 2) {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  try {
    const jsonString = JSON.stringify(data, null, indent);

    if (!(await pathExists(dirname(path)))) {
      await fsExtraEnsureDir(dirname(path));
    }

    await atomicWriteFile(path, jsonString, "utf8");
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("circular")) {
      throw new Error(`Cannot serialize circular structure to JSON: ${path}`);
    }

    throw err;
  }
}

/**
 * Ensures a file exists with optional default content.
 * @param {string} path - The path to the file.
 * @param {string} [defaultContent=''] - The default content to write if the file doesn't exist.
 * @returns {Promise<void>}
 * @throws {Error} When path is invalid or write operation fails
 */
async function ensureFile(path, defaultContent = "") {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  if (defaultContent && typeof defaultContent !== "string") {
    throw new Error("Default content must be a string");
  }

  await fsExtraEnsureFile(path);

  if (defaultContent) {
    const stats = await stat(path);
    if (stats.size === 0) await atomicWriteFile(path, defaultContent, "utf8");
  }
}

/**
 * Ensures a JSON file exists with default content if it doesn't exist.
 * @param {string} path - The path to the JSON file.
 * @param {any} defaultContent - The default content to write if the file doesn't exist.
 * @param {number} [indent=2] - Number of spaces to use for indentation.
 * @returns {Promise<void>}
 * @throws {Error} When path is invalid or write operation fails
 */
async function ensureJsonFile(path, defaultContent, indent = 2) {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  try {
    const exists = await fsExtraPathExists(path);
    if (!exists) await writeJson(path, defaultContent, indent);
  } catch (err) {
    await writeJson(path, defaultContent, indent);
  }
}

/**
 * Recursively reads all files in a directory and its subdirectories.
 * @param {string} dirPath - The directory path to read recursively.
 * @param {Object} [options] - Options for filtering and processing.
 * @param {Function} [options.filter] - Filter function to determine which files to include.
 * @param {boolean} [options.filesOnly=true] - Whether to include only files (not directories).
 * @returns {Promise<string[]>} Array of absolute file paths.
 * @throws {Error} When path is invalid or directory doesn't exist
 */
async function readDirRecursive(dirPath, options = {}) {
  if (!dirPath || typeof dirPath !== "string") {
    throw new Error("Directory path must be a non-empty string");
  }

  const { filter, filesOnly = true } = options;
  const results = [];

  try {
    await totalist(dirPath, (name, absPath, stats) => {
      if (filesOnly && !stats.isFile()) return;
      if (filter && !filter(name, absPath, stats)) return;
      results.push(absPath);
    });

    return results;
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    throw err;
  }
}

/**
 * Deletes a file if it exists.
 * @param {string} path - The path to the file to delete.
 * @returns {Promise<void>}
 * @throws {Error} When path is invalid or deletion fails
 */
async function deleteFile(path) {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  try {
    await unlink(path);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

/**
 * Deletes a directory and all of its contents if it exists.
 * @param {string} path - The path to the directory to delete.
 * @returns {Promise<void>}
 * @throws {Error} When path is invalid or deletion fails
 */
async function deleteDirectory(path) {
  if (!path || typeof path !== "string") {
    throw new Error("Path must be a non-empty string");
  }

  try {
    await rm(path, { recursive: true, force: true });
  } catch (err) {
    if (err && err.code !== "ENOENT") throw err;
  }
}

module.exports = {
  ensureDir,
  pathExists,
  readFile,
  writeFile,
  appendFile,
  readJson,
  writeJson,
  ensureFile,
  ensureJsonFile,
  deleteFile,
  deleteDirectory,
  readDirRecursive,
};
