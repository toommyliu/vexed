import { get } from "svelte/store";
import { loadHotkeys } from "~/shared/hotkeys/storage";
import type { HotkeyId } from "~/shared/hotkeys/schema";
import { platform } from "./platform.svelte";

let _values = $state<Record<HotkeyId, string>>({} as Record<HotkeyId, string>);
let _loaded = $state(false);

async function load(): Promise<void> {
  try {
    const currentPlatform = get(platform);
    const sections = await loadHotkeys(currentPlatform);
    const newValues: Record<HotkeyId, string> = {} as Record<HotkeyId, string>;
    for (const section of sections) {
      for (const item of section.items) {
        if (!item.value) continue;
        newValues[item.id] = item.value;
      }
    }

    _values = newValues;
    _loaded = true;
  } catch (error) {
    console.error(error);
  }
}

function getDisplayValue(actionId: HotkeyId): string {
  return _values[actionId] ?? "";
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
};
