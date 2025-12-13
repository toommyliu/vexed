import _isHotkey from "is-hotkey";
import type { HotkeySection } from "./types";

export const isMac = process.platform === "darwin";

export function isValidHotkey(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  return _isHotkey(input) && input.trim() !== "";
}

export function normalizeHotkey(hotkey: string): string {
  if (!hotkey) return "";

  const parts = hotkey.toLowerCase().split("+");
  const modifiers: string[] = [];
  let key = "";

  for (const part of parts) {
    if (part === "command" || part === "cmd" || part === "meta") {
      modifiers.push(isMac ? "command" : "meta");
    } else if (part === "ctrl" || part === "control") {
      modifiers.push("ctrl");
    } else if (part === "alt" || part === "option") {
      modifiers.push("alt");
    } else if (part === "shift") {
      modifiers.push("shift");
    } else {
      key = part;
    }
  }

  const order = ["command", "meta", "ctrl", "alt", "shift"];
  modifiers.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  if (key) modifiers.push(key);
  return modifiers.join("+");
}

export function formatHotkey(hotkey: string): string {
  if (!hotkey) return "None";

  const normalized = normalizeHotkey(hotkey);

  return normalized
    .split("+")
    .map((part) => {
      if (part === "ctrl" || part === "control") return isMac ? "⌃" : "Ctrl";
      if (part === "alt" || part === "option") return isMac ? "⌥" : "Alt";
      if (part === "shift") return isMac ? "⇧" : "Shift";
      if (part === "cmd" || part === "command") return "⌘";
      if (part === "meta") return isMac ? "⌘" : "Win";

      if (part === "space") return "␣";
      if (part === "enter" || part === "return") return "↵";
      if (part === "tab") return "⇥";
      if (part === "escape" || part === "esc") return "Esc";
      if (part === "backspace") return "⌫";
      if (part === "delete" || part === "del") return "⌦";
      if (part === "up") return "↑";
      if (part === "down") return "↓";
      if (part === "left") return "←";
      if (part === "right") return "→";

      if (/^f\d+$/i.test(part)) return part.toUpperCase();

      return part.toUpperCase();
    })
    .join("+");
}

export function parseKeyboardEvent(ev: KeyboardEvent): string | null {
  if (ev.key === "Escape" || ev.key === "Backspace") {
    return null;
  }

  const parts: string[] = [];

  if (ev.metaKey) parts.push(isMac ? "command" : "meta");
  if (ev.ctrlKey) parts.push("ctrl");
  if (ev.altKey) parts.push("alt");
  if (ev.shiftKey) parts.push("shift");

  let keyName = ev.key.toLowerCase();
  if (keyName === " ") keyName = "space";

  const modifierKeys = ["control", "alt", "shift", "meta"];
  if (modifierKeys.includes(keyName) || !keyName || keyName.trim() === "") {
    return null;
  }

  parts.push(keyName);
  const combination = parts.join("+");

  return isValidHotkey(combination) ? combination : null;
}

/**
 * Creates a hotkey item from a label, auto-generating id and configKey.
 */
function item(sectionName: string, label: string): { configKey: string; id: string; label: string; value: string } {
  const id = label.toLowerCase().replaceAll(/\s+/g, "-").replaceAll(/[^\da-z-]/g, "");
  return {
    id,
    label,
    configKey: `${sectionName}.${label}`,
    value: "",
  };
}

/**
 * Creates a hotkey section from a name and list of labels.
 */
function section(name: string, labels: string[]): HotkeySection {
  return {
    id: name.toLowerCase(),
    name,
    icon: name.toLowerCase(),
    items: labels.map((label) => item(name, label)),
  };
}

export function createHotkeyConfig(): HotkeySection[] {
  return [
    section("General", [
      "Toggle Autoattack",
      "Toggle Bank",
      "Toggle Options Panel",
      "Toggle Top Bar",
    ]),
    section("Application", [
      "Open App Logs",
      "Open Environment",
    ]),
    section("Scripts", [
      "Load Script",
      "Toggle Script",
      "Toggle Command Overlay",
      "Toggle Dev Tools",
    ]),
    section("Options", [
      "Toggle Infinite Range",
      "Toggle Provoke Cell",
      "Toggle Enemy Magnet",
      "Toggle Lag Killer",
      "Toggle Hide Players",
      "Toggle Skip Cutscenes",
      "Toggle Disable FX",
      "Toggle Disable Collisions",
      "Toggle Anti-Counter",
      "Toggle Disable Death Ads",
    ]),
    section("Tools", [
      "Open Fast Travels",
      "Open Loader/Grabber",
      "Open Follower",
    ]),
    section("Packets", [
      "Open Packet Logger",
      "Open Packet Spammer",
    ]),
  ];
}

export function findConflicts(sections: HotkeySection[]): string[] {
  const allHotkeys = sections
    .flatMap((section) => section.items)
    .map((item) => item.value)
    .filter((value) => value !== "");

  const conflicts: string[] = [];
  const seen = new Set<string>();

  for (const hotkey of allHotkeys) {
    if (seen.has(hotkey)) {
      conflicts.push(hotkey);
    } else {
      seen.add(hotkey);
    }
  }

  return conflicts;
}

export function getActionForHotkey(
  hotkey: string,
  sections: HotkeySection[],
): string | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.value === hotkey) {
        return item.label;
      }
    }
  }

  return null;
}
