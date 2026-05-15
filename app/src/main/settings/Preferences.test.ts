import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as Preferences from "./Preferences";

describe("preferences", () => {
  it("normalizes valid values", () => {
    expect(
      Preferences.normalize({
        checkForUpdates: false,
        commandOverlay: {
          layout: {
            position: { x: 42, y: 24 },
            size: { width: 420, height: 240 },
            collapsed: true,
          },
        },
        launchMode: "account-manager",
        ignored: true,
      }),
    ).toEqual({
      checkForUpdates: false,
      commandOverlay: {
        layout: {
          position: { x: 42, y: 24 },
          size: { width: 420, height: 240 },
          collapsed: true,
        },
      },
      launchMode: "account-manager",
    });
  });

  it("falls back to defaults for invalid command overlay layout fields", () => {
    expect(
      Preferences.normalize({
        commandOverlay: {
          layout: {
            position: { x: -1, y: 24 },
            size: { width: Number.NaN, height: 240 },
            collapsed: "yes",
          },
        },
      }).commandOverlay.layout,
    ).toEqual({
      position: {
        x: Preferences.DEFAULT.commandOverlay.layout.position.x,
        y: 24,
      },
      size: {
        width: Preferences.DEFAULT.commandOverlay.layout.size.width,
        height: 240,
      },
      collapsed: Preferences.DEFAULT.commandOverlay.layout.collapsed,
    });
  });

  it("falls back to defaults for invalid values", () => {
    expect(
      Preferences.normalize({
        checkForUpdates: "yes",
        launchMode: "settings",
      }),
    ).toEqual(Preferences.DEFAULT);

    expect(Preferences.normalize(null)).toEqual(Preferences.DEFAULT);
  });

  it("resolves preferences under VEXED_HOME userdata", () => {
    const previous = process.env["VEXED_HOME"];
    process.env["VEXED_HOME"] = "/tmp/vexed-test";
    try {
      expect(Preferences.path()).toBe(
        join("/tmp/vexed-test", "userdata", "preferences.yaml"),
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
