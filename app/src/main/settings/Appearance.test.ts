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

  it("serializes app motion mode and cursor pointer toggles", () => {
    expect(
      Appearance.serialize({
        ...Appearance.DEFAULT,
        reduceMotion: "off",
        useCursorPointers: true,
      }),
    ).toMatchObject({
      reduceMotion: "off",
      useCursorPointers: true,
    });
  });

  it("does not rewrite partial hex color JSON on read", () => {
    const value = {
      themeMode: "dark",
      themes: {
        dark: {
          tokens: {
            primary: "#0d9488",
          },
        },
      },
    };
    const normalized = Appearance.normalize(value);

    expect(normalized.themes.dark.tokens.primary).toEqual([13, 148, 136]);
    expect(
      Appearance.shouldRewritePersisted(
        value,
        normalized,
        Appearance.serialize(normalized),
      ),
    ).toBe(false);
  });

  it("serializes color tokens as hex strings", () => {
    expect(
      Appearance.serialize({
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
      }),
    ).toMatchObject({
      themes: {
        light: {
          tokens: {
            primary: "#0d9488",
          },
        },
        dark: {
          tokens: {
            ring: "#60a5fa",
          },
        },
      },
    });
  });

  it("marks array color tokens for rewrite", () => {
    const value = {
      themeMode: "dark",
      themes: {
        light: {
          tokens: {
            primary: [13, 148, 136],
          },
        },
      },
    };
    const normalized = Appearance.normalize(value);

    expect(
      Appearance.shouldRewritePersisted(
        value,
        normalized,
        Appearance.serialize(normalized),
      ),
    ).toBe(true);
  });
});
