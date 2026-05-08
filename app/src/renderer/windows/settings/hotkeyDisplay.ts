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

const nonMacDisplayAliases: Readonly<Record<string, string>> = {
  alt: "Alt",
  meta: "Win",
  option: "Alt",
  control: "Ctrl",
  ctrl: "Ctrl",
  mod: "Ctrl",
  shift: "Shift",
};

const splitHotkeyParts = (value: string): readonly string[] => {
  // Settings persist canonical accelerator strings, but reload paths can hand
  // this formatter either "Alt+B" or already split display text like "Alt B".
  const trimmed = value.trim();
  return trimmed.includes("+") ? trimmed.split("+") : trimmed.split(/\s+/);
};

const displayKeyPart = (part: string, platform: AppPlatform): string => {
  const trimmedPart = part.trim();
  const aliases = platform === "mac" ? macDisplayAliases : nonMacDisplayAliases;
  const displayPart = aliases[trimmedPart.toLowerCase()];
  if (displayPart !== undefined) {
    return displayPart;
  }

  return /^[a-z]$/i.test(trimmedPart) ? trimmedPart.toUpperCase() : trimmedPart;
};

export const displayHotkey = (value: string, platform: AppPlatform): string => {
  if (value === "") {
    return "Unbound";
  }

  const separator = platform === "mac" ? " " : "+";
  return displayHotkeyParts(value, platform).join(separator);
};

export const displayHotkeyParts = (
  value: string,
  platform: AppPlatform,
): readonly string[] => {
  if (value === "") {
    return ["Unbound"];
  }

  return splitHotkeyParts(value)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => displayKeyPart(part, platform));
};
