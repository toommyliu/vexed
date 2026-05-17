import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as Appearance from "./Appearance";
import * as Files from "./Files";

describe("appearance settings", () => {
  afterEach(() => {
    Files.resetPathConfigurationForTests();
  });

  it("normalizes theme mode selection", () => {
    expect(
      Appearance.normalize({
        themeMode: "system",
        themes: {},
      }),
    ).toEqual({
      themeMode: "system",
      reduceMotion: Appearance.DEFAULT.reduceMotion,
      useCursorPointers: Appearance.DEFAULT.useCursorPointers,
      themes: {
        light: Appearance.DEFAULT.themes.light,
        dark: Appearance.DEFAULT.themes.dark,
      },
    });
  });

  it("normalizes light and dark theme profiles", () => {
    expect(
      Appearance.normalize({
        themeMode: "dark",
        themes: {
          light: {
            tokens: {
              primary: [13, 148, 136],
              unknown: [1, 2, 3],
            },
            sansFont: "  Inter  ",
            monoFont: "",
            sansFontSize: 9,
            monoFontSize: "large",
            rounding: -1,
          },
          dark: {
            tokens: {
              primary: [96, 165, 250],
              ring: [96, 165, 250],
              border: [256, 0, 0],
            },
            sansFont: "System",
            monoFont: "Mono",
            sansFontSize: 30,
            monoFontSize: 12.4,
            rounding: 3,
          },
        },
      }),
    ).toEqual({
      themeMode: "dark",
      reduceMotion: Appearance.DEFAULT.reduceMotion,
      useCursorPointers: Appearance.DEFAULT.useCursorPointers,
      themes: {
        light: {
          tokens: {
            primary: [13, 148, 136],
          },
          sansFont: "Inter",
          monoFont: Appearance.DEFAULT.themes.light.monoFont,
          sansFontSize: 10,
          monoFontSize: Appearance.DEFAULT.themes.light.monoFontSize,
          rounding: 0,
        },
        dark: {
          tokens: {
            primary: [96, 165, 250],
            ring: [96, 165, 250],
          },
          sansFont: "System",
          monoFont: "Mono",
          sansFontSize: 24,
          monoFontSize: 12,
          rounding: 2,
        },
      },
    });
  });

  it("normalizes hex color tokens", () => {
    expect(
      Appearance.normalize({
        themeMode: "dark",
        themes: {
          light: {
            tokens: {
              primary: "#0d9488",
              ring: "60a5fa",
            },
          },
        },
      }).themes.light.tokens,
    ).toEqual({
      primary: [13, 148, 136],
      ring: [96, 165, 250],
    });
  });

  it("falls back to defaults for invalid values", () => {
    expect(Appearance.normalize(null)).toEqual(Appearance.DEFAULT);

    expect(
      Appearance.normalize({
        themeMode: "custom",
        themes: {
          light: "bad",
          dark: {
            tokens: {
              primary: [1, 2],
            },
            sansFontSize: Number.NaN,
            monoFontSize: Number.POSITIVE_INFINITY,
          },
        },
      }),
    ).toEqual({
      themeMode: Appearance.DEFAULT.themeMode,
      reduceMotion: Appearance.DEFAULT.reduceMotion,
      useCursorPointers: Appearance.DEFAULT.useCursorPointers,
      themes: {
        light: Appearance.DEFAULT.themes.light,
        dark: Appearance.DEFAULT.themes.dark,
      },
    });
  });

  it("preserves valid font sizes", () => {
    expect(
      Appearance.normalize({
        themeMode: "dark",
        themes: {
          light: {
            sansFontSize: 14,
            monoFontSize: 11,
          },
          dark: {
            sansFontSize: 18,
            monoFontSize: 16,
          },
        },
      }).themes,
    ).toMatchObject({
      light: {
        sansFontSize: 14,
        monoFontSize: 11,
      },
      dark: {
        sansFontSize: 18,
        monoFontSize: 16,
      },
    });
  });

  it("normalizes app motion mode and cursor pointer toggles", () => {
    expect(
      Appearance.normalize({
        themeMode: "dark",
        reduceMotion: "on",
        useCursorPointers: true,
        themes: {},
      }),
    ).toMatchObject({
      reduceMotion: "on",
      useCursorPointers: true,
    });

    expect(
      Appearance.normalize({
        themeMode: "dark",
        reduceMotion: "sometimes",
        useCursorPointers: 1,
        themes: {},
      }),
    ).toMatchObject({
      reduceMotion: Appearance.DEFAULT.reduceMotion,
      useCursorPointers: Appearance.DEFAULT.useCursorPointers,
    });
  });

  it("writes app motion mode and cursor pointer toggles", async () => {
    const testDir = await mkdtemp(join(tmpdir(), "vexed-appearance-"));
    Files.configureAppDataHome(testDir);

    try {
      Appearance.write({
        ...Appearance.DEFAULT,
        reduceMotion: "off",
        useCursorPointers: true,
      });

      const source = await readFile(Appearance.path(), "utf8");
      expect(source).toContain('"reduceMotion": "off"');
      expect(source).toContain('"useCursorPointers": true');
      expect(Appearance.read()).toMatchObject({
        reduceMotion: "off",
        useCursorPointers: true,
      });
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it("does not rewrite partial hex color JSON on ensure", async () => {
    const testDir = await mkdtemp(join(tmpdir(), "vexed-appearance-"));
    Files.configureAppDataHome(testDir);

    try {
      const source = `${JSON.stringify(
        {
          themeMode: "dark",
          themes: {
            dark: {
              tokens: {
                primary: "#0d9488",
              },
            },
          },
        },
        null,
        2,
      )}\n`;
      await writeFile(Appearance.path(), source, "utf8");

      expect(Appearance.ensure().themes.dark.tokens.primary).toEqual([
        13, 148, 136,
      ]);
      expect(await readFile(Appearance.path(), "utf8")).toBe(source);
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it("writes color tokens as hex strings", async () => {
    const testDir = await mkdtemp(join(tmpdir(), "vexed-appearance-"));
    Files.configureAppDataHome(testDir);

    try {
      Appearance.write({
        ...Appearance.DEFAULT,
        themes: {
          light: {
            ...Appearance.DEFAULT.themes.light,
            tokens: {
              primary: [13, 148, 136],
            },
          },
          dark: {
            ...Appearance.DEFAULT.themes.dark,
            tokens: {
              ring: [96, 165, 250],
            },
          },
        },
      });

      expect(await readFile(Appearance.path(), "utf8")).toContain(
        '"primary": "#0d9488"',
      );
      expect(await readFile(Appearance.path(), "utf8")).toContain(
        '"ring": "#60a5fa"',
      );
      expect(Appearance.read().themes.light.tokens.primary).toEqual([
        13, 148, 136,
      ]);
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it("resolves appearance under app data", () => {
    Files.configureAppDataHome("/tmp/vexed-test");

    expect(Appearance.path()).toBe(
      join("/tmp/vexed-test", "appearance.json"),
    );
  });
});
