import _isHotkey from "is-hotkey";
import type { HotkeySection } from "./types";

export const isMac = process.platform === "darwin";

export function isValidHotkey(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  return _isHotkey(input) && input.trim() !== "";
}

export function formatHotkey(hotkey: string): string {
  if (!hotkey) return "None";

  return hotkey
    .split("+")
    .map((part) => {
      // Modifier keys
      if (part === "ctrl" || part === "control") return "Ctrl";
      if (part === "alt" || part === "option") return "Alt";
      if (part === "shift") return "Shift";
      if (part === "cmd" || part === "command") return "Command";
      if (part === "meta") return isMac ? "Command" : "Win";

      // "Special" keys"
      if (part === "space") return "Space";
      if (part === "enter" || part === "return") return "Enter";
      if (part === "tab") return "Tab";
      if (part === "escape" || part === "esc") return "Esc";
      if (part === "backspace") return "Backspace";
      if (part === "delete" || part === "del") return "Delete";
      if (part === "up") return "Up";
      if (part === "down") return "Down";
      if (part === "left") return "Left";
      if (part === "right") return "Right";

      // Function keys
      if (/^f\d+$/i.test(part)) return part.toUpperCase();

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("+");
}

export function parseKeyboardEvent(ev: KeyboardEvent): string | null {
  // Stop recording on Escape or Backspace
  if (ev.key === "Escape" || ev.key === "Backspace") {
    return null;
  }

  const parts: string[] = [];
  if (ev.ctrlKey) parts.push("ctrl");
  if (ev.altKey) parts.push("alt");
  if (ev.shiftKey) parts.push("shift");
  if (ev.metaKey) parts.push(isMac ? "command" : "meta");

  let keyName = ev.key.toLowerCase();
  if (keyName === " ") keyName = "space";

  // Don't allow modifiers as the only key
  const modifierKeys = ["control", "alt", "shift", "meta"];
  if (modifierKeys.includes(keyName) || !keyName || keyName.trim() === "") {
    return null;
  }

  parts.push(keyName);
  const combination = parts.join("+");

  return isValidHotkey(combination) ? combination : null;
}

export function createHotkeyConfig(): HotkeySection[] {
  return [
    {
      id: "general",
      name: "General",
      icon: "general",
      items: [
        {
          id: "toggle-autoattack",
          label: "Toggle Autoattack",
          configKey: "General.Toggle Autoattack",
          value: "",
        },
        {
          id: "toggle-bank",
          label: "Toggle Bank",
          configKey: "General.Toggle Bank",
          value: "",
        },
        {
          id: "toggle-top-bar",
          label: "Toggle Top Bar",
          configKey: "General.Toggle Top Bar",
          value: "",
        },
      ],
    },
    {
      id: "application",
      name: "Application",
      icon: "application",
      items: [
        {
          id: "open-app-logs",
          label: "Open App Logs",
          configKey: "Application.Open App Logs",
          value: "",
        },
      ],
    },
    {
      id: "scripts",
      name: "Scripts",
      icon: "scripts",
      items: [
        {
          id: "load-script",
          label: "Load Script",
          configKey: "Scripts.Load Script",
          value: "",
        },
        {
          id: "toggle-script",
          label: "Toggle Script",
          configKey: "Scripts.Toggle Script",
          value: "",
        },
        {
          id: "toggle-command-overlay",
          label: "Toggle Command Overlay",
          configKey: "Scripts.Toggle Command Overlay",
          value: "",
        },
        {
          id: "toggle-dev-tools",
          label: "Toggle Dev Tools",
          configKey: "Scripts.Toggle Dev Tools",
          value: "",
        },
      ],
    },
    {
      id: "tools",
      name: "Tools",
      icon: "tools",
      items: [
        {
          id: "open-fast-travels",
          label: "Open Fast Travels",
          configKey: "Tools.Open Fast Travels",
          value: "",
        },
        {
          id: "open-loader-grabber",
          label: "Open Loader/Grabber",
          configKey: "Tools.Open Loader Grabber",
          value: "",
        },
        {
          id: "open-follower",
          label: "Open Follower",
          configKey: "Tools.Open Follower",
          value: "",
        },
      ],
    },
    {
      id: "packets",
      name: "Packets",
      icon: "packets",
      items: [
        {
          id: "open-packet-logger",
          label: "Open Packet Logger",
          configKey: "Packets.Open Packet Logger",
          value: "",
        },
        {
          id: "open-packet-spammer",
          label: "Open Packet Spammer",
          configKey: "Packets.Open Packet Spammer",
          value: "",
        },
      ],
    },
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
