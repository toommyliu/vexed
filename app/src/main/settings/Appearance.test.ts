import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as Appearance from "./Appearance";

describe("appearance settings", () => {
  it("normalizes theme mode selection", () => {
    expect(
      Appearance.normalize({
        themeMode: "system",
        themes: {},
      }),
    ).toEqual({
      themeMode: "system",
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
            rounding: 3,
          },
        },
      }),
    ).toEqual({
      themeMode: "dark",
      themes: {
        light: {
          tokens: {
            primary: [13, 148, 136],
          },
          sansFont: "Inter",
          monoFont: Appearance.DEFAULT.themes.light.monoFont,
          rounding: 0,
        },
        dark: {
          tokens: {
            primary: [96, 165, 250],
            ring: [96, 165, 250],
          },
          sansFont: "System",
          monoFont: "Mono",
          rounding: 2,
        },
      },
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
          },
        },
      }),
    ).toEqual({
      themeMode: Appearance.DEFAULT.themeMode,
      themes: {
        light: Appearance.DEFAULT.themes.light,
        dark: Appearance.DEFAULT.themes.dark,
      },
    });
  });

  it("resolves appearance under VEXED_HOME userdata", () => {
    const previous = process.env["VEXED_HOME"];
    process.env["VEXED_HOME"] = "/tmp/vexed-test";
    try {
      expect(Appearance.path()).toBe(
        join("/tmp/vexed-test", "userdata", "appearance.json"),
      );
    } finally {
      if (previous === undefined) {
        delete process.env["VEXED_HOME"];
      } else {
        process.env["VEXED_HOME"] = previous;
      }
    }
  });
});
