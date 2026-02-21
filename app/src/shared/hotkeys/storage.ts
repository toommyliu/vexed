import { Result } from "better-result";
import { client } from "~/shared/tipc";
import type { HotkeyConfig, Platform } from "../types";
import { isValidHotkey } from "./input";
import {
  getHotkeyItems,
  getHotkeySections,
  type HotkeyId,
  type HotkeySection,
  createDefaultHotkeyConfig,
} from "./schema";

export async function loadHotkeys(
  platform: Platform,
): Promise<HotkeySection[]> {
  const sections = getHotkeySections(platform);
  const serialized = await client.hotkeys.all();
  const result = Result.deserialize<HotkeyConfig, unknown>(serialized);
  const config =
    result.isOk() && result.value
      ? result.value
      : createDefaultHotkeyConfig(platform);

  if (result.isErr())
    console.error("Failed to load hotkeys config", result.error);

  return sections.map((section) => ({
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

export async function saveHotkey(
  id: HotkeyId,
  value: string,
  platform: Platform,
): Promise<boolean> {
  const item = getHotkeyItems(platform).find((item) => item.id === id);
  if (!item) return false;
  const cleaned = value.trim();
  const finalValue = cleaned === "" ? "" : cleaned;
  if (finalValue && !isValidHotkey(finalValue)) return false;
  const serialized = await client.hotkeys.update({
    id: item.id,
    value: finalValue,
    configKey: item.configKey,
  });
  const result = Result.deserialize<undefined, unknown>(serialized);
  if (result.isErr()) {
    console.error("Failed to save hotkey", result.error);
    return false;
  }

  return true;
}

export async function restoreDefaults(): Promise<boolean> {
  const serialized = await client.hotkeys.restore();
  const result = Result.deserialize<undefined, unknown>(serialized);
  if (result.isErr()) {
    console.error("Failed to restore default hotkeys", result.error);
    return false;
  }

  return true;
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
