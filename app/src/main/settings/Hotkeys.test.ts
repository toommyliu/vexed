import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as Files from "./Files";
import {
  DEFAULT,
  applyPatch,
  normalize,
  normalizeHotkeyValue,
  path,
} from "./Hotkeys";
import { normalizeHotkeyBinding } from "../../shared/hotkeys";

describe("hotkey settings", () => {
  afterEach(() => {
    Files.resetPathConfigurationForTests();
  });

  it("normalizes valid bindings", () => {
    expect(
      normalize({
        bindings: {
          "load-script": "mod+o",
          "toggle-lag-killer": "alt+l",
        },
      }).bindings,
    ).toMatchObject({
      "load-script": "Mod+O",
      "toggle-lag-killer": "Alt+L",
    });
  });

  it("supports platform-explicit macOS Control bindings", () => {
    expect(normalizeHotkeyBinding("Control+Z", "mac")).toBe("Control+Z");
    expect(normalizeHotkeyBinding("Command+Z", "mac")).toBe("Mod+Z");
  });

  it("discards unknown command ids", () => {
    expect(
      normalize({
        bindings: {
          "load-script": "Mod+O",
          unknown: "Alt+U",
        },
      }).bindings,
    ).not.toHaveProperty("unknown");
  });

  it("falls back to defaults for invalid values", () => {
    expect(
      normalize({
        bindings: {
          "load-script": "Control",
        },
      }).bindings["load-script"],
    ).toBe(DEFAULT.bindings["load-script"]);

    expect(normalizeHotkeyValue("Control")).toBeUndefined();
  });

  it("preserves empty strings as unbound", () => {
    expect(
      normalize({
        bindings: {
          "load-script": "",
        },
      }).bindings["load-script"],
    ).toBe("");
  });

  it("resets null patch values to defaults", () => {
    const customized = normalize({
      bindings: {
        "load-script": "Alt+O",
      },
    });

    expect(
      applyPatch(customized, {
        "load-script": null,
      }).bindings["load-script"],
    ).toBe(DEFAULT.bindings["load-script"]);
  });

  it("resolves hotkeys under app data", () => {
    Files.configureAppDataHome("/tmp/vexed-test");

    expect(path()).toBe(join("/tmp/vexed-test", "keybindings.json"));
  });
});
