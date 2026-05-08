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

const createFakeRoot = () => {
  const properties = new Map<string, string>();
  const classes = new Set<string>();
  const dataset: Record<string, string> = {};

  return {
    dataset,
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
    const snapshot = createAppearanceSnapshot(DEFAULT_APPEARANCE, false);
    const root = createFakeRoot();

    applyAppearanceSnapshotToDocument(root as unknown as HTMLElement, snapshot);

    expect(root.dataset["theme"]).toBe("dark");
    expect(root.hasClass("dark")).toBe(true);
    expect(root.style.getPropertyValue("--background")).toBe("14, 14, 15");
    expect(root.style.getPropertyValue("--font-sans")).toBe(
      DEFAULT_THEME_PROFILE.sansFont,
    );
    expect(root.style.getPropertyValue("color-scheme")).toBe("dark");
  });
});
