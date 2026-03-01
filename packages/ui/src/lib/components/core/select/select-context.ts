import { getContext, setContext } from "svelte";

export interface SelectItemEntry {
  value: string;
  label: string;
  disabled: boolean;
}

export interface SelectContext {
  // state
  value: () => string;
  open: () => boolean;
  disabled: () => boolean;
  // setters
  setValue: (v: string, label: string) => void;
  setOpen: (v: boolean) => void;
  // trigger ref (for floating positioning)
  triggerEl: () => HTMLElement | null;
  setTriggerEl: (el: HTMLElement | null) => void;
  // item registration (for label lookup & keyboard nav)
  registerItem: (value: string, label: string, disabled: boolean) => void;
  unregisterItem: (value: string) => void;
  getItems: () => SelectItemEntry[];
  // highlighted item (keyboard nav)
  highlightedValue: () => string | null;
  setHighlightedValue: (v: string | null) => void;
  // selected item label (for Value display)
  selectedLabel: () => string;
}

const KEY = Symbol("select");

export function createSelectContext(ctx: SelectContext) {
  setContext(KEY, ctx);
}

export function getSelectContext(): SelectContext {
  return getContext<SelectContext>(KEY);
}
