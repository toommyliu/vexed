import { describe, expect, it } from "vitest";
import { displayHotkeyParts } from "./hotkeyDisplay";

describe("settings hotkey display", () => {
  it("formats modifier parts for macOS", () => {
    expect(displayHotkeyParts("Mod+Shift+X", "mac")).toEqual([
      "⌘",
      "⇧",
      "X",
    ]);
    expect(displayHotkeyParts("Alt+B", "mac")).toEqual(["⌥", "B"]);
    expect(displayHotkeyParts("Alt B", "mac")).toEqual(["⌥", "B"]);
    expect(displayHotkeyParts("Alt+O", "mac")).toEqual(["⌥", "O"]);
    expect(displayHotkeyParts("Control+O", "mac")).toEqual(["⌃", "O"]);
  });

  it("formats modifier parts for Windows", () => {
    expect(displayHotkeyParts("Alt+B", "windows")).toEqual(["Alt", "B"]);
    expect(displayHotkeyParts("Mod+Shift+X", "windows")).toEqual([
      "Ctrl",
      "Shift",
      "X",
    ]);
  });
});
