import { getContext, setContext } from "svelte";

export interface ComboboxItemEntry {
  value: string;
  label: string;
  disabled: boolean;
}

export interface ComboboxContext {
  // state
  value: () => string;
  open: () => boolean;
  disabled: () => boolean;
  // setters
  setValue: (v: string, label: string) => void;
  setOpen: (v: boolean) => void;
  // input ref (for focus / positioning anchor)
  inputEl: () => HTMLInputElement | null;
  setInputEl: (el: HTMLInputElement | null) => void;
  // trigger ref (standalone trigger button)
  triggerEl: () => HTMLElement | null;
  setTriggerEl: (el: HTMLElement | null) => void;
  // item registration (for keyboard nav)
  registerItem: (value: string, label: string, disabled: boolean) => void;
  unregisterItem: (value: string) => void;
  getItems: () => ComboboxItemEntry[];
  // highlighted item (keyboard nav in dropdown)
  highlightedValue: () => string | null;
  setHighlightedValue: (v: string | null) => void;
}

const KEY = Symbol("combobox");

export function createComboboxContext(ctx: ComboboxContext) {
  setContext(KEY, ctx);
}

export function getComboboxContext(): ComboboxContext {
  return getContext<ComboboxContext>(KEY);
}
