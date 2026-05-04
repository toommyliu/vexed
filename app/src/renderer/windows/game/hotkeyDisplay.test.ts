import { describe, expect, it } from "vitest";
import { formatGameShortcut } from "./hotkeyDisplay";

describe("game top nav hotkey display", () => {
  it("formats shortcuts for macOS", () => {
    expect(formatGameShortcut("Mod+O", "mac")).toBe("⌘ O");
    expect(formatGameShortcut("Mod+Shift+X", "mac")).toBe("⌘ ⇧ X");
  });

  it("formats shortcuts for Windows", () => {
    expect(formatGameShortcut("Mod+O", "windows")).toBe("Ctrl+O");
    expect(formatGameShortcut("Mod+Shift+X", "windows")).toBe("Ctrl+Shift+X");
  });

  it("formats shortcuts for Linux", () => {
    expect(formatGameShortcut("Mod+O", "linux")).toBe("Ctrl+O");
    expect(formatGameShortcut("Mod+Shift+X", "linux")).toBe("Ctrl+Shift+X");
  });

  it("hides empty shortcuts", () => {
    expect(formatGameShortcut("", "mac")).toBeNull();
  });
});
