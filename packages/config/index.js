const { resolve } = require("path");
const { readJson, writeJson, pathExists } = require("@vexed/fs-utils");

class Config {
  /**
   * Creates a new Config instance and loads it from disk.
   * @param {Object} options - Configuration options
   * @returns {Promise<Config>} The loaded config instance
   */
  static async create(options = {}) {
    const config = new Config(options);
    await config.load();
    return config;
  }

  constructor(options = {}) {
    this.configName = options.configName || "config";
    this.cwd = options.cwd || process.cwd();
    this.defaults = options.defaults || {};

    this.path = resolve(this.cwd, `${this.configName}.json`);
    this._cache = null;
  }

  async load() {
    if (this._cache !== null) return this._cache;

    try {
      if (await pathExists(this.path)) {
        const loaded = await readJson(this.path);
        this._cache = this._deepMerge(this.defaults, loaded);

        // any defaults added?
        if (JSON.stringify(this._cache) !== JSON.stringify(loaded)) {
          await writeJson(this.path, this._cache);
        }
      } else {
        this._cache = { ...this.defaults };
        await writeJson(this.path, this._cache);
      }
    } catch (err) {
      this._cache = { ...this.defaults };
    }

    return this._cache;
  }

  async save() {
    if (this._cache === null) {
      this._cache = { ...this.defaults };
    }

    await writeJson(this.path, this._cache);
  }

  /**
   * Set a value and immediately persist to disk.
   * @param {string|Object} key - The key to set or an object with multiple key-value pairs
   * @param {*} value - The value to set (ignored when key is an object)
   */
  async setAndSave(key, value) {
    this.set(key, value);
    await this.save();
  }

  /**
   * Reload configuration from disk, discarding any in-memory cache.
   * Returns the freshly loaded store.
   */
  async reload() {
    this._cache = null;
    return this.load();
  }

  get(key, defaultValue) {
    const store =
      this._cache !== null ? this._cache : (this._cache = { ...this.defaults });

    if (key === undefined) {
      return store;
    }

    if (typeof key === "string" && key.includes(".")) {
      return this._getNestedValue(store, key, defaultValue);
    }

    return key in store ? store[key] : defaultValue;
  }

  /**
   * Get a string value from the config.
   * @param {string} key - The key to get
   * @param {string} defaultValue - Default value if key doesn't exist or isn't a string
   * @returns {string}
   */
  getString(key, defaultValue = "") {
    const val = this.get(key, defaultValue);
    return typeof val === "string" ? val : defaultValue;
  }

  /**
   * Get a number value from the config.
   * @param {string} key - The key to get
   * @param {number} defaultValue - Default value if key doesn't exist or isn't a number
   * @returns {number}
   */
  getNumber(key, defaultValue = 0) {
    const val = this.get(key, defaultValue);
    return typeof val === "number" ? val : defaultValue;
  }

  /**
   * Get a boolean value from the config.
   * @param {string} key - The key to get
   * @param {boolean} defaultValue - Default value if key doesn't exist or isn't a boolean
   * @returns {boolean}
   */
  getBoolean(key, defaultValue = false) {
    const val = this.get(key, defaultValue);
    return typeof val === "boolean" ? val : defaultValue;
  }

  set(key, value) {
    if (typeof key === "object" && key !== null) {
      const store =
        this._cache !== null
          ? this._cache
          : (this._cache = { ...this.defaults });
      Object.assign(store, key);
      this._cache = store;
      return;
    }

    if (typeof key !== "string") {
      throw new TypeError("Key must be a string");
    }

    const store =
      this._cache !== null ? this._cache : (this._cache = { ...this.defaults });

    if (key.includes(".")) {
      this._setNestedValue(store, key, value);
    } else {
      store[key] = value;
    }

    this._cache = store;
  }

  has(key) {
    if (this._cache === null) return false;

    if (typeof key === "string" && key.includes(".")) {
      return this._hasNestedValue(this._cache, key);
    }

    return key in this._cache;
  }

  delete(key) {
    const store =
      this._cache !== null ? this._cache : (this._cache = { ...this.defaults });

    if (typeof key === "string" && key.includes(".")) {
      this._deleteNestedValue(store, key);
    } else {
      delete store[key];
    }

    this._cache = store;
  }

  clear() {
    this._cache = { ...this.defaults };
  }

  reset() {
    this._cache = null;
    return this._cache;
  }

  /**
   * Deep merge two objects. Source values take precedence.
   * @param {Object} target - The target (defaults)
   * @param {Object} source - The source (loaded values)
   * @returns {Object} The merged object
   */
  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        result[key] = this._deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  _getNestedValue(obj, path, defaultValue) {
    const keys = String(path).split(".");
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }

    return current;
  }

  _setNestedValue(obj, path, value) {
    const keys = String(path).split(".");
    const lastKey = keys.pop();
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

  _hasNestedValue(obj, path) {
    const keys = String(path).split(".");
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  _deleteNestedValue(obj, path) {
    const keys = String(path).split(".");
    const lastKey = keys.pop();
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

module.exports = Config;
