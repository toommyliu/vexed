import { getContext, setContext } from "svelte";

export type MenuItemEntry = {
  el: HTMLElement;
  disabled: boolean;
};

export interface MenuContext {
  open: () => boolean;
  setOpen: (v: boolean) => void;
  triggerEl: () => HTMLElement | null;
  setTriggerEl: (el: HTMLElement | null) => void;
  contentEl: () => HTMLElement | null;
  setContentEl: (el: HTMLElement | null) => void;
  registerItem: (el: HTMLElement, disabled: boolean) => void;
  unregisterItem: (el: HTMLElement) => void;
  getItems: () => MenuItemEntry[];
  highlightedEl: () => HTMLElement | null;
  setHighlightedEl: (el: HTMLElement | null) => void;
  closeAll: () => void;
}

export interface SubMenuContext {
  open: () => boolean;
  setOpen: (v: boolean) => void;
  triggerEl: () => HTMLElement | null;
  setTriggerEl: (el: HTMLElement | null) => void;
  contentEl: () => HTMLElement | null;
  setContentEl: (el: HTMLElement | null) => void;
  registerItem: (el: HTMLElement, disabled: boolean) => void;
  unregisterItem: (el: HTMLElement) => void;
  getItems: () => MenuItemEntry[];
  highlightedEl: () => HTMLElement | null;
  setHighlightedEl: (el: HTMLElement | null) => void;
  /** Cancel a pending scheduled close (set by sub-trigger, cleared by safe-triangle). */
  cancelScheduledClose: () => void;
  /** Schedule a close with a given delay; safe-triangle can cancel it. */
  scheduleClose: (delayMs: number) => void;
}

export interface RadioGroupContext {
  value: () => string;
  setValue: (v: string) => void;
}

const ROOT_KEY = Symbol("menu-root");
const SUB_KEY = Symbol("menu-sub");
const RADIO_KEY = Symbol("menu-radio-group");

export function createMenuContext(ctx: MenuContext) {
  setContext(ROOT_KEY, ctx);
}

export function getMenuContext(): MenuContext {
  return getContext<MenuContext>(ROOT_KEY);
}

export function createSubMenuContext(ctx: SubMenuContext) {
  setContext(SUB_KEY, ctx);
}

export function getSubMenuContext(): SubMenuContext {
  return getContext<SubMenuContext>(SUB_KEY);
}

export function createRadioGroupContext(ctx: RadioGroupContext) {
  setContext(RADIO_KEY, ctx);
}

export function getRadioGroupContext(): RadioGroupContext {
  return getContext<RadioGroupContext>(RADIO_KEY);
}
