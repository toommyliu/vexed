import { describe, expect, it } from "vitest";
import { normalizeHotkeyBinding } from "./hotkeys";

describe("hotkey normalization", () => {
  it("keeps macOS Control distinct from Mod", () => {
    expect(normalizeHotkeyBinding("Control+Z", "mac")).toBe("Control+Z");
    expect(normalizeHotkeyBinding("Command+Z", "mac")).toBe("Mod+Z");
    expect(normalizeHotkeyBinding("Meta+Z", "mac")).toBe("Mod+Z");
  });

  it("maps Control to Mod on Windows and Linux", () => {
    expect(normalizeHotkeyBinding("Control+Z", "windows")).toBe("Mod+Z");
    expect(normalizeHotkeyBinding("Control+Z", "linux")).toBe("Mod+Z");
  });
});
