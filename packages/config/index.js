const { resolve } = require("path");
const { readJson, writeJson, pathExists } = require("@vexed/fs-utils");

class Config {
  constructor(options = {}) {
    this.configName = options.configName || "config";
    this.cwd = options.cwd || process.cwd();
    this.defaults = options.defaults || {};

    this.path = resolve(this.cwd, `${this.configName}.json`);
    this._cache = null;
  }

  async init() {
    if (this._cache !== null) return this._cache;

    try {
      if (await pathExists(this.path)) {
        this._cache = await readJson(this.path);
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
