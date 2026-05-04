import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as Appearance from "./Appearance";

describe("appearance settings", () => {
  it("normalizes theme mode selection", () => {
    expect(
      Appearance.normalize({
        themeMode: "system",
        tokenOverrides: {},
      }),
    ).toEqual({
      themeMode: "system",
      tokenOverrides: {
        light: {},
        dark: {},
      },
    });
  });

  it("normalizes light and dark token overrides", () => {
    expect(
      Appearance.normalize({
        themeMode: "dark",
        tokenOverrides: {
          light: {
            primary: [13, 148, 136],
            unknown: [1, 2, 3],
          },
          dark: {
            primary: [96, 165, 250],
            ring: [96, 165, 250],
            border: [256, 0, 0],
          },
        },
      }),
    ).toEqual({
      themeMode: "dark",
      tokenOverrides: {
        light: {
          primary: [13, 148, 136],
        },
        dark: {
          primary: [96, 165, 250],
          ring: [96, 165, 250],
        },
      },
    });
  });

  it("falls back to defaults for invalid values", () => {
    expect(Appearance.normalize(null)).toEqual(Appearance.DEFAULT);

    expect(
      Appearance.normalize({
        themeMode: "custom",
        tokenOverrides: {
          light: "bad",
          dark: {
            primary: [1, 2],
          },
        },
      }),
    ).toEqual(Appearance.DEFAULT);
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
