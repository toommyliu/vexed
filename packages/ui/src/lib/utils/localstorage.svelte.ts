// https://github.com/Rich-Harris/local-storage-test

import { tick } from "svelte";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [Key in string]: JsonValue };
type JsonArray = JsonValue[];

type DeepProxy<T> = T extends JsonPrimitive
  ? T
  : T extends Array<infer U>
    ? Array<DeepProxy<U>>
    : T extends object
      ? { [K in keyof T]: DeepProxy<T[K]> }
      : never;

export class LocalStorage<T extends JsonValue> {
  #key: string;
  #version = $state(0);
  #listeners = 0;
  #value: T | undefined;
  #handler = (e: StorageEvent) => {
    if (e.storageArea !== localStorage) return;
    if (e.key !== this.#key) return;
    this.#version += 1;
  };

  constructor(key: string, initial?: T) {
    this.#key = key;
    this.#value = initial;
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem(key) === null && initial !== undefined) {
        localStorage.setItem(key, JSON.stringify(initial));
      }
    }
  }

  get current(): DeepProxy<T> {
    this.#version;

    const root: T =
      typeof localStorage !== "undefined"
        ? (JSON.parse(localStorage.getItem(this.#key)!) as T)
        : (this.#value as T);

    const proxies = new WeakMap<object, object>();

    const proxy = <V extends JsonValue>(value: V): DeepProxy<V> => {
      if (typeof value !== "object" || value === null) {
        return value as DeepProxy<V>;
      }

      let p = proxies.get(value);
      if (!p) {
        p = new Proxy(value, {
          get: (target, property: string | symbol) => {
            const val = Reflect.get(target, property);
            if (typeof val === "function") {
              return val.bind(target);
            }
            return proxy(val as JsonValue);
          },
          set: (target, property: string | symbol, newValue: JsonValue) => {
            this.#version += 1;
            Reflect.set(target, property, newValue);
            if (typeof localStorage !== "undefined") {
              localStorage.setItem(this.#key, JSON.stringify(root));
            }
            return true;
          },
        });
        proxies.set(value, p);
      }

      return p as DeepProxy<V>;
    };

    if ($effect.tracking()) {
      $effect(() => {
        if (this.#listeners === 0) {
          window.addEventListener("storage", this.#handler);
        }
        this.#listeners += 1;
        return () => {
          tick().then(() => {
            this.#listeners -= 1;
            if (this.#listeners === 0) {
              window.removeEventListener("storage", this.#handler);
            }
          });
        };
      });
    }

    return proxy(root);
  }

  set current(value: T) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.#key, JSON.stringify(value));
    }
    this.#version += 1;
  }
}
