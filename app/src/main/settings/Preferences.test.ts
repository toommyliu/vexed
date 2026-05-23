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
});
