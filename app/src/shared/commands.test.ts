import { describe, expect, it } from "vitest";
import { normalizeHotkeyBinding } from "./hotkeys";
import {
  GAME_COMMANDS,
  GAME_COMMAND_IDS,
  getDefaultHotkeys,
  isGameCommandId,
} from "./commands";

describe("game command registry", () => {
  it("declares unique command ids", () => {
    expect(new Set(GAME_COMMAND_IDS).size).toBe(GAME_COMMAND_IDS.length);
    expect(GAME_COMMAND_IDS).toHaveLength(GAME_COMMANDS.length);
  });

  it("uses normalizable default hotkeys", () => {
    for (const command of GAME_COMMANDS) {
      if (command.defaultHotkey === "") {
        continue;
      }

      expect(normalizeHotkeyBinding(command.defaultHotkey)).toBe(
        command.defaultHotkey,
      );
    }
  });

  it("keeps macOS Control distinct from Mod", () => {
    expect(normalizeHotkeyBinding("Control+Z", "mac")).toBe("Control+Z");
    expect(normalizeHotkeyBinding("Meta+Z", "mac")).toBe("Mod+Z");
  });

  it("maps Control to Mod on Windows and Linux", () => {
    expect(normalizeHotkeyBinding("Control+Z", "windows")).toBe("Mod+Z");
    expect(normalizeHotkeyBinding("Control+Z", "linux")).toBe("Mod+Z");
  });

  it("creates defaults for every command", () => {
    const defaults = getDefaultHotkeys();

    expect(Object.keys(defaults).sort()).toEqual([...GAME_COMMAND_IDS].sort());
  });

  it("validates command ids", () => {
    expect(isGameCommandId("load-script")).toBe(true);
    expect(isGameCommandId("missing-command")).toBe(false);
    expect(isGameCommandId(null)).toBe(false);
  });
});
