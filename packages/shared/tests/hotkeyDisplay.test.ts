import { describe, expect, it } from "vitest";
import {
  formatHotkeyDisplay,
  formatHotkeyDisplayParts,
  formatOptionalHotkeyDisplay,
} from "../src/hotkeyDisplay";

describe("hotkey display", () => {
  it("formats modifier parts for macOS", () => {
    expect(formatHotkeyDisplayParts("Mod+Shift+X", "mac")).toEqual([
      "⌘",
      "⇧",
      "X",
    ]);
    expect(formatHotkeyDisplayParts("Alt+B", "mac")).toEqual(["⌥", "B"]);
    expect(formatHotkeyDisplayParts("Alt B", "mac")).toEqual(["⌥", "B"]);
    expect(formatHotkeyDisplayParts("Alt+O", "mac")).toEqual(["⌥", "O"]);
    expect(formatHotkeyDisplayParts("Control+O", "mac")).toEqual(["⌃", "O"]);
  });

  it("formats modifier parts for Windows", () => {
    expect(formatHotkeyDisplayParts("Alt+B", "windows")).toEqual(["Alt", "B"]);
    expect(formatHotkeyDisplayParts("Shift+Meta+D", "windows")).toEqual([
      "Shift",
      "Win",
      "D",
    ]);
    expect(formatHotkeyDisplayParts("Mod+O", "windows")).toEqual(["Ctrl", "O"]);
    expect(formatHotkeyDisplayParts("Mod+Shift+X", "windows")).toEqual([
      "Ctrl",
      "Shift",
      "X",
    ]);
    expect(formatHotkeyDisplayParts("Mod+Shift+,", "windows")).toEqual([
      "Ctrl",
      "Shift",
      ",",
    ]);
  });

  it("formats display strings by platform", () => {
    expect(formatHotkeyDisplay("Mod+Shift+X", "mac")).toBe("⌘ ⇧ X");
    expect(formatHotkeyDisplay("Mod+Shift+X", "windows")).toBe("Ctrl+Shift+X");
    expect(formatHotkeyDisplay("Mod+Shift+X", "linux")).toBe("Ctrl+Shift+X");
  });

  it("supports unbound labels and optional displays", () => {
    expect(formatHotkeyDisplay("", "mac")).toBe("Unbound");
    expect(formatHotkeyDisplayParts("", "mac")).toEqual(["Unbound"]);
    expect(formatOptionalHotkeyDisplay("", "mac")).toBeNull();
    expect(formatOptionalHotkeyDisplay("Mod+O", "mac")).toBe("⌘ O");
  });
});
