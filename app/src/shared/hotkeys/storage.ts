import { client } from "~/shared/tipc";
import type { HotkeyConfig } from "../types";
import { isValidHotkey } from "./input";
import {
  HOTKEY_ITEMS,
  HOTKEY_SECTIONS,
  type HotkeyId,
  type HotkeySection,
  createDefaultHotkeyConfig,
} from "./schema";

export type HotkeyValueMap = Record<HotkeyId, string>;

export async function loadHotkeys(): Promise<HotkeySection[]> {
  const result = await client.hotkeys.all();
  const config: HotkeyConfig =
    (result && "data" in result && result.success && result.data
      ? result.data
      : undefined) ?? createDefaultHotkeyConfig();
  return HOTKEY_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      value: readConfigValue(
        config,
        section.name,
        item.label,
        item.defaultValue,
      ),
    })),
  }));
}

export async function saveHotkey(id: HotkeyId, value: string): Promise<void> {
  const item = HOTKEY_ITEMS.find((item) => item.id === id);
  if (!item) return;

  const cleaned = value.trim();
  const finalValue = cleaned === "" ? "" : cleaned;
  if (finalValue && !isValidHotkey(finalValue)) return;

  await client.hotkeys.update({
    id: item.id,
    value: finalValue,
    configKey: item.configKey,
  });
}

export async function restoreDefaults(): Promise<void> {
  await client.hotkeys.restore();
}

function readConfigValue(
  config: HotkeyConfig,
  sectionName: string,
  label: string,
  fallback: string,
): string {
  const section = config[sectionName as keyof HotkeyConfig] as
    | Record<string, string>
    | undefined;
  if (!section) return fallback;
  const value = section[label];
  return value && isValidHotkey(value) ? value : fallback;
}
