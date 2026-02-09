import _isHotkey from "is-hotkey";
import type { Platform } from "../types";

const CODE_TO_KEY: Record<string, string> = {
  KeyA: "a",
  KeyB: "b",
  KeyC: "c",
  KeyD: "d",
  KeyE: "e",
  KeyF: "f",
  KeyG: "g",
  KeyH: "h",
  KeyI: "i",
  KeyJ: "j",
  KeyK: "k",
  KeyL: "l",
  KeyM: "m",
  KeyN: "n",
  KeyO: "o",
  KeyP: "p",
  KeyQ: "q",
  KeyR: "r",
  KeyS: "s",
  KeyT: "t",
  KeyU: "u",
  KeyV: "v",
  KeyW: "w",
  KeyX: "x",
  KeyY: "y",
  KeyZ: "z",

  Digit0: "0",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",

  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",

  Numpad0: "num0",
  Numpad1: "num1",
  Numpad2: "num2",
  Numpad3: "num3",
  Numpad4: "num4",
  Numpad5: "num5",
  Numpad6: "num6",
  Numpad7: "num7",
  Numpad8: "num8",
  Numpad9: "num9",
  NumpadAdd: "numadd",
  NumpadSubtract: "numsub",
  NumpadMultiply: "nummult",
  NumpadDivide: "numdiv",

  F1: "f1",
  F2: "f2",
  F3: "f3",
  F4: "f4",
  F5: "f5",
  F6: "f6",
  F7: "f7",
  F8: "f8",
  F9: "f9",
  F10: "f10",
  F11: "f11",
  F12: "f12",

  Space: "space",
  Enter: "enter",
  Tab: "tab",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
  Insert: "insert",
  Delete: "delete",
};

const MODIFIER_KEYS = ["control", "alt", "shift", "meta"];

export function isValidHotkey(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  return _isHotkey(input) && input.trim() !== "";
}

export function parseKeyboardEvent(
  ev: KeyboardEvent,
  platform: Platform,
): string | null {
  if (ev.key === "Escape" || ev.key === "Backspace") return null;

  const parts: string[] = [];
  if (ev.metaKey) parts.push(platform.isMac ? "command" : "meta");
  if (ev.ctrlKey) parts.push("ctrl");
  if (ev.altKey) parts.push("alt");
  if (ev.shiftKey) parts.push("shift");

  let keyName = CODE_TO_KEY[ev.code];
  if (!keyName) {
    keyName = ev.key.toLowerCase();
    if (keyName === " ") keyName = "space";
  }

  if (MODIFIER_KEYS.includes(keyName) || !keyName || keyName.trim() === "")
    return null;
  parts.push(keyName);
  const combination = parts.join("+");
  return isValidHotkey(combination) ? combination : null;
}
