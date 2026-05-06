import { formatForDisplay } from "@tanstack/solid-hotkeys";
import type { AppPlatform } from "../../../shared/ipc";

const macDisplayAliases: Readonly<Record<string, string>> = {
  alt: "⌥",
  option: "⌥",
  "⌥": "⌥",
  control: "⌃",
  ctrl: "⌃",
  "⌃": "⌃",
  command: "⌘",
  cmd: "⌘",
  meta: "⌘",
  mod: "⌘",
  "⌘": "⌘",
  shift: "⇧",
  "⇧": "⇧",
};

const displayMacHotkey = (value: string): string => {
  // Settings persist canonical accelerator strings, but reload paths can hand
  // this formatter either "Alt+B" or already split display text like "Alt B".
  // Parse both forms here so macOS Option always renders as "⌥" without
  // changing the stored binding format.
  const trimmed = value.trim();
  const parts = trimmed.includes("+")
    ? trimmed.split("+")
    : trimmed.split(/\s+/);

  return parts
    .filter((part) => part.trim().length > 0)
    .map((part) => {
      const trimmedPart = part.trim();
      const displayPart = macDisplayAliases[trimmedPart.toLowerCase()];
      if (displayPart !== undefined) {
        return displayPart;
      }

      return /^[a-z]$/i.test(trimmedPart) ? trimmedPart.toUpperCase() : trimmedPart;
    })
    .join(" ");
};

export const displayHotkey = (value: string, platform: AppPlatform): string => {
  if (value === "") {
    return "Unbound";
  }

  try {
    if (platform === "mac") {
      return displayMacHotkey(value);
    }

    return formatForDisplay(value, { platform });
  } catch {
    return value;
  }
};

export const displayHotkeyParts = (
  value: string,
  platform: AppPlatform,
): readonly string[] => {
  const display = displayHotkey(value, platform);
  if (display === "Unbound") {
    return [display];
  }

  const separator = display.includes("+") ? "+" : /\s+/;
  return display
    .split(separator)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
};
