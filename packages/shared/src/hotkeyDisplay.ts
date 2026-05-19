export type HotkeyDisplayPlatform = "mac" | "windows" | "linux";

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
  const trimmed = value.trim();
  return trimmed.includes("+") ? trimmed.split("+") : trimmed.split(/\s+/);
};

const displayKeyPart = (
  part: string,
  platform: HotkeyDisplayPlatform,
): string => {
  const trimmedPart = part.trim();
  const aliases = platform === "mac" ? macDisplayAliases : nonMacDisplayAliases;
  const displayPart = aliases[trimmedPart.toLowerCase()];
  if (displayPart !== undefined) {
    return displayPart;
  }

  return /^[a-z]$/i.test(trimmedPart) ? trimmedPart.toUpperCase() : trimmedPart;
};

export const formatHotkeyDisplayParts = (
  value: string,
  platform: HotkeyDisplayPlatform,
  emptyLabel = "Unbound",
): readonly string[] => {
  if (value === "") {
    return [emptyLabel];
  }

  return splitHotkeyParts(value)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => displayKeyPart(part, platform));
};

export const formatHotkeyDisplay = (
  value: string,
  platform: HotkeyDisplayPlatform,
  emptyLabel = "Unbound",
): string => {
  if (value === "") {
    return emptyLabel;
  }

  const separator = platform === "mac" ? " " : "+";
  return formatHotkeyDisplayParts(value, platform, emptyLabel).join(separator);
};

export const formatOptionalHotkeyDisplay = (
  value: string,
  platform: HotkeyDisplayPlatform,
): string | null =>
  value === "" ? null : formatHotkeyDisplay(value, platform);
