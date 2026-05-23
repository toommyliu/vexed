import { isGameCommandId, type GameCommandId } from "../../shared/commands";
import {
  DEFAULT_HOTKEYS,
  createHotkeyBindings,
  createDefaultHotkeyBindings,
  normalizeHotkeyBinding,
  type HotkeyBindings,
  type HotkeyPlatform,
  type HotkeysSettings,
} from "../../shared/hotkeys";

export type { HotkeyBindings, HotkeysSettings };

export const DEFAULT: HotkeysSettings = DEFAULT_HOTKEYS;

const platform: HotkeyPlatform =
  process.platform === "darwin"
    ? "mac"
    : process.platform === "win32"
      ? "windows"
      : "linux";

export const normalizeHotkeyValue = (value: unknown): string | undefined =>
  normalizeHotkeyBinding(value, platform);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readBindingEntries = (
  value: unknown,
): readonly Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

export const normalize = (value: unknown): HotkeysSettings => {
  const values = new Map<GameCommandId, string>();

  for (const entry of readBindingEntries(value)) {
    const id = entry["id"];
    if (!isGameCommandId(id)) {
      continue;
    }

    const rawValue = entry["value"];
    const normalized = normalizeHotkeyValue(rawValue);
    if (normalized !== undefined) {
      values.set(id, normalized);
    }
  }

  return { bindings: createHotkeyBindings(values) };
};

export const fileName = "keybindings.json";

export const serialize = (
  settings: HotkeysSettings,
): HotkeysSettings["bindings"] => normalize(settings.bindings).bindings;

export const applyPatch = (
  current: HotkeysSettings,
  patch: readonly unknown[],
): HotkeysSettings => {
  const defaults = new Map(
    createDefaultHotkeyBindings().map((binding) => [binding.id, binding.value]),
  );
  const values = new Map(
    current.bindings.map((binding) => [binding.id, binding.value]),
  );

  for (const entry of patch) {
    if (!isRecord(entry) || !isGameCommandId(entry["id"])) {
      continue;
    }

    const id = entry["id"];
    const rawValue = entry["value"];
    if (rawValue === null) {
      values.set(id, defaults.get(id) ?? "");
      continue;
    }

    const normalized = normalizeHotkeyValue(rawValue);
    if (normalized !== undefined) {
      values.set(id, normalized);
    }
  }

  return { bindings: createHotkeyBindings(values) };
};
