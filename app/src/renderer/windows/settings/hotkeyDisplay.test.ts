import { describe, expect, it } from "vitest";
import { displayHotkeyParts } from "./hotkeyDisplay";

describe("settings hotkey display", () => {
  it("formats modifier parts for macOS", () => {
    expect(displayHotkeyParts("Mod+Shift+X", "mac")).toEqual([
      "⌘",
      "⇧",
      "X",
    ]);
  });

  it("formats modifier parts for Windows", () => {
    expect(displayHotkeyParts("Mod+Shift+X", "windows")).toEqual([
      "Ctrl",
      "Shift",
      "X",
    ]);
  });
});
