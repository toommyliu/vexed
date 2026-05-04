import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as Preferences from "./Preferences";

describe("preferences", () => {
  it("normalizes valid values", () => {
    expect(
      Preferences.normalize({
        checkForUpdates: false,
        launchMode: "account-manager",
        ignored: true,
      }),
    ).toEqual({
      checkForUpdates: false,
      launchMode: "account-manager",
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
        join("/tmp/vexed-test", "userdata", "preferences.json"),
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
