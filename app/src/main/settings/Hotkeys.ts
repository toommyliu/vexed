import * as Files from "./Files";
import { GAME_COMMANDS, isGameCommandId } from "../../shared/commands";
import {
  DEFAULT_HOTKEYS,
  createDefaultHotkeyBindings,
  normalizeHotkeyBinding,
  type HotkeyBindings,
  type HotkeysSettings,
} from "../../shared/hotkeys";

export type { HotkeyBindings, HotkeysSettings };

export const DEFAULT: HotkeysSettings = DEFAULT_HOTKEYS;

export const normalizeHotkeyValue = normalizeHotkeyBinding;

export const normalize = (value: unknown): HotkeysSettings => {
  const defaults = createDefaultHotkeyBindings();
  if (typeof value !== "object" || value === null) {
    return {
      bindings: defaults,
    };
  }

  const record = value as Record<string, unknown>;
  const rawBindings =
    typeof record["bindings"] === "object" && record["bindings"] !== null
      ? (record["bindings"] as Record<string, unknown>)
      : {};
  const bindings: HotkeyBindings = {};

  for (const command of GAME_COMMANDS) {
    const rawValue = rawBindings[command.id];
    const normalized = normalizeHotkeyValue(rawValue);
    bindings[command.id] =
      normalized === undefined ? (defaults[command.id] ?? "") : normalized;
  }

  for (const [id, rawValue] of Object.entries(rawBindings)) {
    if (!isGameCommandId(id)) {
      continue;
    }

    const normalized = normalizeHotkeyValue(rawValue);
    bindings[id] = normalized === undefined ? (defaults[id] ?? "") : normalized;
  }

  return { bindings };
};

export const path = (): string => Files.join("keybindings.json");

export const read = (): HotkeysSettings => normalize(Files.readJson(path()));

export const write = (settings: HotkeysSettings): void => {
  Files.writeJson(path(), normalize(settings));
};

export const ensure = (): HotkeysSettings =>
  Files.ensureJson(path(), DEFAULT, normalize);

export const applyPatch = (
  current: HotkeysSettings,
  patch: Record<string, unknown>,
): HotkeysSettings => {
  const defaults = createDefaultHotkeyBindings();
  const bindings: HotkeyBindings = {
    ...current.bindings,
  };

  for (const [id, rawValue] of Object.entries(patch)) {
    if (!isGameCommandId(id)) {
      continue;
    }

    if (rawValue === null) {
      bindings[id] = defaults[id] ?? "";
      continue;
    }

    const normalized = normalizeHotkeyValue(rawValue);
    if (normalized !== undefined) {
      bindings[id] = normalized;
    }
  }

  return normalize({ bindings });
};
