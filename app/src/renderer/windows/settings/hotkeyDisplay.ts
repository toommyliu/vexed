import { formatForDisplay } from "@tanstack/solid-hotkeys";
import type { AppPlatform } from "../../../shared/ipc";

export const displayHotkey = (value: string, platform: AppPlatform): string => {
  if (value === "") {
    return "Unbound";
  }

  try {
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
