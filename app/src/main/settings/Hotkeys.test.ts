import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as Files from "./Files";
import {
  DEFAULT,
  applyPatch,
  normalize,
  normalizeHotkeyValue,
  path,
  write,
} from "./Hotkeys";
import {
  normalizeHotkeyBinding,
  readHotkeyBinding,
} from "../../shared/hotkeys";

describe("hotkey settings", () => {
  afterEach(() => {
    Files.resetPathConfigurationForTests();
  });

  it("normalizes valid bindings", () => {
    const bindings = normalize([
      { id: "loadScript", value: "mod+o" },
      { id: "toggleLagKiller", value: "alt+l" },
    ]).bindings;

    expect(readHotkeyBinding(bindings, "loadScript")).toBe("Mod+O");
    expect(readHotkeyBinding(bindings, "toggleLagKiller")).toBe("Alt+L");
  });

  it("supports platform-explicit macOS Control bindings", () => {
    expect(normalizeHotkeyBinding("Control+Z", "mac")).toBe("Control+Z");
    expect(normalizeHotkeyBinding("Command+Z", "mac")).toBe("Mod+Z");
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

  it("writes keybindings as a top-level array", () => {
    Files.configureAppDataHome("/tmp/vexed-test");

    write(normalize([{ id: "loadScript", value: "Alt+O" }]));

    expect(Files.readJson(path())).toEqual(
      expect.arrayContaining([{ id: "loadScript", value: "Alt+O" }]),
    );
  });

  it("resolves hotkeys under app data", () => {
    Files.configureAppDataHome("/tmp/vexed-test");

    expect(path()).toBe(join("/tmp/vexed-test", "keybindings.json"));
  });
});
