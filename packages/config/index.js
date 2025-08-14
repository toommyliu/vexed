const { resolve, split } = require("path");
const { readJson, writeJson, pathExists } = require("@vexed/fs-utils");

class Config {
  constructor(options = {}) {
    this.configName = options.configName || "config";
    this.cwd = options.cwd || process.cwd();
    this.defaults = options.defaults || {};

    this.path = resolve(this.cwd, `${this.configName}.json`);
    this._cache = null;
  }

  async _load() {
    if (this._cache !== null) {
      return this._cache;
    }

    try {
      if (await pathExists(this.path)) {
        this._cache = await readJson(this.path);
      } else {
        this._cache = { ...this.defaults };
        await this._save();
      }
    } catch (error) {
      this._cache = { ...this.defaults };
    }

    return this._cache;
  }

  async _save() {
    if (this._cache !== null) {
      await writeJson(this.path, this._cache);
    }
  }

  async get(key, defaultValue) {
    const store = await this._load();

    if (key === undefined) {
      return store;
    }

    if (key.includes(".")) {
      return this._getNestedValue(store, key, defaultValue);
    }

    return key in store ? store[key] : defaultValue;
  }

  async set(key, value) {
    if (typeof key === "object" && key !== null) {
      const store = await this._load();
      Object.assign(store, key);
      this._cache = store;
      await this._save();
      return;
    }

    if (typeof key !== "string") {
      throw new TypeError("Key must be a string");
    }

    const store = await this._load();

    if (key.includes(".")) {
      this._setNestedValue(store, key, value);
    } else {
      store[key] = value;
    }

    this._cache = store;
    await this._save();
  }

  async has(key) {
    const store = await this._load();

    if (key.includes(".")) {
      return this._hasNestedValue(store, key);
    }

    return key in store;
  }

  async delete(key) {
    const store = await this._load();

    if (key.includes(".")) {
      this._deleteNestedValue(store, key);
    } else {
      delete store[key];
    }

    this._cache = store;
    await this._save();
  }

  async clear() {
    this._cache = { ...this.defaults };
    await this._save();
  }

  async reset() {
    this._cache = null;
    return this._load();
  }

  _getNestedValue(obj, path, defaultValue) {
    const keys = split(".");
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
    const keys = split(".");
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
    const keys = split(".");
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
    const keys = split(".");
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
