import {
  hasNonModifierKey,
  normalizeRegisterableHotkey,
  validateHotkey,
  type RegisterableHotkey,
} from "@tanstack/solid-hotkeys";
import {
  getDefaultHotkeys,
  type GameCommandId,
  type DefaultHotkeyBindings,
} from "./commands";

export type HotkeyBindings = Partial<Record<GameCommandId, string>>;
export type HotkeyPlatform = "mac" | "windows" | "linux";

export interface HotkeysSettings {
  readonly bindings: HotkeyBindings;
}

export interface HotkeysPatch {
  readonly bindings?: Partial<Record<GameCommandId, string | null>>;
}

export const DEFAULT_HOTKEYS: HotkeysSettings = {
  bindings: getDefaultHotkeys(),
};

export const normalizeHotkeyBinding = (
  value: unknown,
  platform?: HotkeyPlatform,
): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }

  try {
    const normalized = normalizeRegisterableHotkey(
      trimmed as RegisterableHotkey,
      platform,
    );
    const validation = validateHotkey(normalized);
    return validation.valid && hasNonModifierKey(normalized, platform)
      ? normalized
      : undefined;
  } catch {
    return undefined;
  }
};

export const createDefaultHotkeyBindings = (): HotkeyBindings => ({
  ...(getDefaultHotkeys() satisfies DefaultHotkeyBindings),
});
