import { getContext, setContext } from "svelte";

export interface TooltipContext {
  open: () => boolean;
  setOpen: (v: boolean) => void;
  triggerEl: () => HTMLElement | null;
  setTriggerEl: (el: HTMLElement | null) => void;
  delayDuration: () => number;
  contentId: () => string;
}

export interface ProviderContext {
  delayDuration: () => number;
}

const TOOLTIP_KEY = Symbol("tooltip");
const PROVIDER_KEY = Symbol("tooltip-provider");

export function createTooltipContext(ctx: TooltipContext) {
  setContext(TOOLTIP_KEY, ctx);
}

export function getTooltipContext(): TooltipContext {
  return getContext<TooltipContext>(TOOLTIP_KEY);
}

export function createProviderContext(ctx: ProviderContext) {
  setContext(PROVIDER_KEY, ctx);
}

export function getProviderContext(): ProviderContext | undefined {
  return getContext<ProviderContext | undefined>(PROVIDER_KEY);
}
