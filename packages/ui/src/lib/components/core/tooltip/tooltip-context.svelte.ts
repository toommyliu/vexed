import { setContext, getContext } from "svelte";
import type { Placement } from "@floating-ui/dom";

export class TooltipState {
  open = $state(false);
  contentId = $state("");
  triggerEl = $state<HTMLElement | null>(null);
  openDelay = $state(0);
  closeDelay = $state(0);
  placement = $state<Placement>("top");
  sideOffset = $state(4);

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(config: { openDelay?: number; closeDelay?: number } = {}) {
    this.openDelay = config.openDelay ?? 0;
    this.closeDelay = config.closeDelay ?? 0;

    // Generate a temporary ID that will be replaced or used if no hydration
    this.contentId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;
  }

  setTriggerEl = (el: HTMLElement | null) => {
    this.triggerEl = el;
  };

  updateTriggerEl = () => {
    if (this.triggerEl || typeof document === "undefined") return;
    const el = document.querySelector(`[data-tooltip-id="${this.contentId}"]`);
    if (el instanceof HTMLElement) {
      this.triggerEl = el;
    }
  };

  show = () => {
    this.updateTriggerEl();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.openDelay > 0 && !this.open) {
      this.timeoutId = setTimeout(() => {
        this.open = true;
        this.timeoutId = null;
      }, this.openDelay);
    } else {
      this.open = true;
    }
  };

  hide = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.closeDelay > 0 && this.open) {
      this.timeoutId = setTimeout(() => {
        this.open = false;
        this.timeoutId = null;
      }, this.closeDelay);
    } else {
      this.open = false;
    }
  };

  toggle = () => {
    if (this.open) this.hide();
    else this.show();
  };

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.open) {
      this.open = false;
    }
  };
}

const TOOLTIP_CONTEXT_KEY = Symbol("tooltip");

export function setTooltipContext(state: TooltipState) {
  setContext(TOOLTIP_CONTEXT_KEY, state);
}

export function getTooltipContext() {
  const context = getContext<TooltipState>(TOOLTIP_CONTEXT_KEY);
  if (!context) {
    throw new Error("getTooltipContext must be used within Tooltip.Root");
  }
  return context;
}
