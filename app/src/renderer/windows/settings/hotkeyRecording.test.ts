import { describe, expect, it } from "vitest";
import { normalizeHotkeyBinding } from "../../../shared/hotkeys";
import { readRecordedHotkeyFromEvent } from "./hotkeyRecording";

describe("settings hotkey recording", () => {
  it("records macOS Option letter chords by physical key", () => {
    const recorded = readRecordedHotkeyFromEvent({
      altKey: true,
      code: "KeyI",
      ctrlKey: false,
      key: "¬",
      metaKey: false,
      shiftKey: false,
    });

    expect(recorded).toBe("Alt+I");
    expect(normalizeHotkeyBinding(recorded, "mac")).toBe("Alt+I");
  });

  it("records macOS Option punctuation chords by physical key", () => {
    const recorded = readRecordedHotkeyFromEvent({
      altKey: true,
      code: "Minus",
      ctrlKey: false,
      key: "–",
      metaKey: false,
      shiftKey: false,
    });

    expect(recorded).toBe("Alt+-");
    expect(normalizeHotkeyBinding(recorded, "mac")).toBe("Alt+-");
  });
});
