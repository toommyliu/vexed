import { client } from "~/shared/tipc";
import {
  createHotkeyConfig,
  isValidHotkey,
} from "~/renderer/views/hotkeys/utils";
import type { HotkeyConfig } from "~/shared";

let _values = $state<Record<string, string>>({});
let _loaded = $state(false);

async function load(): Promise<void> {
  try {
    const result = await client.hotkeys.all();
    if (!result?.success || !result.data)
      throw new Error("Failed to load hotkeys");

    const config = result.data;
    const newValues: Record<string, string> = {};
    const sections = createHotkeyConfig();

    for (const section of sections) {
      for (const item of section.items) {
        const [category, label] = item.configKey.split(".");
        if (!category || !label) continue;
        const value = config[category]?.[label];
        if (!value) continue;
        newValues[item.id] = value;
      }
    }

    _values = newValues;
    _loaded = true;
  } catch (error) {
    console.error(error);
  }
}

function getDisplayValue(actionId: string): string {
  return _values[actionId] ?? "";
}

function toRecord(): Record<string, string> {
  return { ..._values };
}

export const hotkeyState = {
  get values() {
    return _values;
  },
  get loaded() {
    return _loaded;
  },
  set loaded(value: boolean) {
    _loaded = value;
  },
  load,
  getDisplayValue,
  toRecord,
};
