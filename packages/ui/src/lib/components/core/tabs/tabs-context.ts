import { getContext, setContext } from "svelte";

export interface TabsContext {
  value: () => string;
  setValue: (v: string) => void;
  orientation: () => "horizontal" | "vertical";
  registerTrigger: (value: string, el: HTMLElement) => void;
  unregisterTrigger: (value: string) => void;
}

const KEY = Symbol("tabs");

export function createTabsContext(ctx: TabsContext) {
  setContext(KEY, ctx);
}

export function getTabsContext(): TabsContext {
  return getContext<TabsContext>(KEY);
}
