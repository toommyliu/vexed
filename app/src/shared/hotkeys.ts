import {
  hasNonModifierKey,
  normalizeRegisterableHotkey,
  validateHotkey,
  type RegisterableHotkey,
} from "@tanstack/solid-hotkeys";
import {
  GAME_COMMANDS,
  getCommandDefinition,
  getDefaultHotkeys,
  type GameCommandId,
} from "./commands";

export interface HotkeyBinding {
  readonly id: GameCommandId;
  readonly value: string;
}

export interface HotkeyBindingPatch {
  readonly id: GameCommandId;
  readonly value: string | null;
}

export type HotkeyBindings = readonly HotkeyBinding[];
export type HotkeyPlatform = "mac" | "windows" | "linux";

export interface HotkeysSettings {
  readonly bindings: HotkeyBindings;
}

export interface HotkeysPatch {
  readonly bindings?: readonly HotkeyBindingPatch[];
}

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

export const createDefaultHotkeyBindings = (): HotkeyBindings =>
  getDefaultHotkeys().map((binding) => ({ ...binding }));

export const readHotkeyBinding = (
  bindings: HotkeyBindings,
  id: GameCommandId,
): string =>
  bindings.find((binding) => binding.id === id)?.value ??
  getCommandDefinition(id).defaultHotkey;

export const createHotkeyBindings = (
  values: ReadonlyMap<GameCommandId, string>,
): HotkeyBindings =>
  GAME_COMMANDS.map((command) => ({
    id: command.id,
    value: values.get(command.id) ?? command.defaultHotkey,
  }));

export const DEFAULT_HOTKEYS: HotkeysSettings = {
  bindings: createDefaultHotkeyBindings(),
};
