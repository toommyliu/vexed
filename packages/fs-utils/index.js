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
const fs = require("fs").promises;

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
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`JSON file not found: ${path}`);
    }

    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${path} - ${error.message}`);
    }

    throw error;
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
    await fsExtraEnsureDir(dirname(path));
    await atomicWriteFile(path, jsonString, "utf8");
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("circular")) {
      throw new Error(`Cannot serialize circular structure to JSON: ${path}`);
    }

    throw error;
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
    const stats = await fs.stat(path);
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
  } catch (error) {
    await writeJson(path, defaultContent, indent);
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
};
