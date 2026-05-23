import { describe, expect, it } from "vitest";
import {
  DEFAULT,
  applyPatch,
  normalize,
  normalizeHotkeyValue,
  serialize,
} from "./Hotkeys";
import { readHotkeyBinding } from "../../shared/hotkeys";

describe("hotkey settings", () => {
  it("normalizes valid bindings", () => {
    const bindings = normalize([
      { id: "loadScript", value: "mod+o" },
      { id: "toggleLagKiller", value: "alt+l" },
    ]).bindings;

    expect(readHotkeyBinding(bindings, "loadScript")).toBe("Mod+O");
    expect(readHotkeyBinding(bindings, "toggleLagKiller")).toBe("Alt+L");
  });

  it("discards unknown command ids", () => {
    expect(
      normalize([
        { id: "loadScript", value: "Mod+O" },
        { id: "unknown", value: "Alt+U" },
      ]).bindings.some((binding) => (binding.id as string) === "unknown"),
    ).toBe(false);
  });

  it("falls back to defaults for invalid values", () => {
    const bindings = normalize([
      { id: "loadScript", value: "Control" },
    ]).bindings;

    expect(readHotkeyBinding(bindings, "loadScript")).toBe(
      readHotkeyBinding(DEFAULT.bindings, "loadScript"),
    );

    expect(normalizeHotkeyValue("Control")).toBeUndefined();
  });

  it("preserves empty strings as unbound", () => {
    expect(
      readHotkeyBinding(
        normalize([{ id: "loadScript", value: "" }]).bindings,
        "loadScript",
      ),
    ).toBe("");
  });

  it("resets null patch values to defaults", () => {
    const customized = normalize([{ id: "loadScript", value: "Alt+O" }]);

    expect(
      readHotkeyBinding(
        applyPatch(customized, [{ id: "loadScript", value: null }]).bindings,
        "loadScript",
      ),
    ).toBe(readHotkeyBinding(DEFAULT.bindings, "loadScript"));
  });

  it("serializes keybindings as a top-level array", () => {
    expect(
      serialize(normalize([{ id: "loadScript", value: "Alt+O" }])),
    ).toEqual(expect.arrayContaining([{ id: "loadScript", value: "Alt+O" }]));
  });
});
