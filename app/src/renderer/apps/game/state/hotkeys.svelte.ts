import { loadHotkeys } from "~/shared/hotkeys/storage";
import type { HotkeyId } from "~/shared/hotkeys/schema";

let _values = $state<Record<HotkeyId, string>>({} as Record<HotkeyId, string>);
let _loaded = $state(false);

async function load(): Promise<void> {
  try {
    const sections = await loadHotkeys();
    const newValues: Record<HotkeyId, string> = {} as Record<
      HotkeyId,
      string
    >;

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
