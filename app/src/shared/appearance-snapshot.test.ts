import { describe, expect, it } from "vitest";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_THEME_PROFILE,
  type Appearance,
} from "./settings";
import {
  applyAppearanceSnapshotToDocument,
  createAppearanceSnapshot,
  readAppearanceSnapshotArgument,
  serializeAppearanceSnapshotArgument,
} from "./appearance-snapshot";

const lightAppearance: Appearance = {
  ...DEFAULT_APPEARANCE,
  themeMode: "light",
};

const systemAppearance: Appearance = {
  ...DEFAULT_APPEARANCE,
  themeMode: "system",
};

const datasetAttributeName = (key: string): string =>
  `data-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;

const createFakeRoot = () => {
  const properties = new Map<string, string>();
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  const dataset = new Proxy({} as DOMStringMap, {
    get(_target, key) {
      return typeof key === "string"
        ? attributes.get(datasetAttributeName(key))
        : undefined;
    },
    set(_target, key, value) {
      if (typeof key === "string") {
        attributes.set(datasetAttributeName(key), String(value));
      }
      return true;
    },
    deleteProperty(_target, key) {
      if (typeof key === "string") {
        attributes.delete(datasetAttributeName(key));
      }
      return true;
    },
  });

  return {
    dataset,
    getAttribute(name: string) {
      return attributes.get(name) ?? null;
    },
    hasAttribute(name: string) {
      return attributes.has(name);
    },
    classList: {
      toggle(name: string, force?: boolean) {
        if (force) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
    },
    style: {
      setProperty(name: string, value: string) {
        properties.set(name, value);
      },
      getPropertyValue(name: string) {
        return properties.get(name) ?? "";
      },
    },
    hasClass(name: string) {
      return classes.has(name);
    },
  };
};

describe("appearance snapshot", () => {
  it("resolves dark appearance with dark defaults", () => {
    const snapshot = createAppearanceSnapshot(DEFAULT_APPEARANCE, false);

    expect(snapshot.variant).toBe("dark");
    expect(snapshot.tokens.background).toEqual([14, 14, 15]);
    expect(snapshot.backgroundColor).toBe("#0e0e0f");
  });

  it("resolves light appearance with light defaults", () => {
    const snapshot = createAppearanceSnapshot(lightAppearance, true);

    expect(snapshot.variant).toBe("light");
    expect(snapshot.tokens.background).toEqual([255, 255, 255]);
    expect(snapshot.backgroundColor).toBe("#ffffff");
  });

  it("resolves system appearance from the current system preference", () => {
    expect(createAppearanceSnapshot(systemAppearance, true).variant).toBe(
      "dark",
    );
    expect(createAppearanceSnapshot(systemAppearance, false).variant).toBe(
      "light",
    );
  });

  it("uses custom background tokens for the Electron background color", () => {
    const appearance: Appearance = {
      ...DEFAULT_APPEARANCE,
      themeMode: "light",
      themes: {
        ...DEFAULT_APPEARANCE.themes,
        light: {
          ...DEFAULT_THEME_PROFILE,
          tokens: {
            background: [12, 34, 56],
          },
        },
      },
    };

    const snapshot = createAppearanceSnapshot(appearance, false);

    expect(snapshot.tokens.background).toEqual([12, 34, 56]);
    expect(snapshot.backgroundColor).toBe("#0c2238");
  });

  it("serializes and reads an appearance snapshot argument", () => {
    const snapshot = createAppearanceSnapshot(lightAppearance, false);
    const argument = serializeAppearanceSnapshotArgument(snapshot);

    expect(readAppearanceSnapshotArgument(["electron", argument])).toEqual(
      snapshot,
    );
  });

  it("ignores missing or malformed appearance snapshot arguments", () => {
    expect(readAppearanceSnapshotArgument(["electron"])).toBeNull();
    expect(
      readAppearanceSnapshotArgument(["electron", "--appearance-snapshot=%"]),
    ).toBeNull();
    expect(
      readAppearanceSnapshotArgument([
        "electron",
        `--appearance-snapshot=${encodeURIComponent("{}")}`,
      ]),
    ).toBeNull();
  });

  it("applies the snapshot to a document root before renderer mount", () => {
    const snapshot = createAppearanceSnapshot(
      {
        ...DEFAULT_APPEARANCE,
        disableAnimations: true,
        useCursorPointers: true,
      },
      false,
    );
    const root = createFakeRoot();

    applyAppearanceSnapshotToDocument(root as unknown as HTMLElement, snapshot);

    expect(root.dataset["theme"]).toBe("dark");
    expect(root.dataset["disableAnimations"]).toBe("true");
    expect(root.dataset["useCursorPointers"]).toBe("true");
    expect(root.getAttribute("data-disable-animations")).toBe("true");
    expect(root.getAttribute("data-use-cursor-pointers")).toBe("true");
    expect(root.hasClass("dark")).toBe(true);
    expect(root.style.getPropertyValue("--background")).toBe("14, 14, 15");
    expect(root.style.getPropertyValue("--cursor-interactive")).toBe("pointer");
    expect(root.style.getPropertyValue("--font-sans")).toBe(
      DEFAULT_THEME_PROFILE.sansFont,
    );
    expect(root.style.getPropertyValue("color-scheme")).toBe("dark");
  });

  it("omits inactive app preference attributes", () => {
    const snapshot = createAppearanceSnapshot(DEFAULT_APPEARANCE, false);
    const root = createFakeRoot();

    root.dataset["disableAnimations"] = "true";
    root.dataset["useCursorPointers"] = "true";
    applyAppearanceSnapshotToDocument(root as unknown as HTMLElement, snapshot);

    expect(root.hasAttribute("data-disable-animations")).toBe(false);
    expect(root.hasAttribute("data-use-cursor-pointers")).toBe(false);
    expect(root.style.getPropertyValue("--cursor-interactive")).toBe("default");
  });
});
