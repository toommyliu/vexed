import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as Files from "./Files";
import * as Preferences from "./Preferences";

describe("preferences", () => {
  afterEach(() => {
    Files.resetPathConfigurationForTests();
  });

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

  it("resolves preferences under app data", () => {
    Files.configureAppDataHome("/tmp/vexed-test");

    expect(Preferences.path()).toBe(
      join("/tmp/vexed-test", "preferences.json"),
    );
  });
});
