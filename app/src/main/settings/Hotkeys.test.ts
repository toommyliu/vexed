import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT,
  applyPatch,
  normalize,
  normalizeHotkeyValue,
  path,
} from "./Hotkeys";

describe("hotkey settings", () => {
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

  it("resolves hotkeys under VEXED_HOME userdata", () => {
    const previous = process.env["VEXED_HOME"];
    process.env["VEXED_HOME"] = "/tmp/vexed-test";
    try {
      expect(path()).toBe(
        join("/tmp/vexed-test", "userdata", "keybindings.json"),
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
