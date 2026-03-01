<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    createTooltipContext,
    getProviderContext,
  } from "./tooltip-context.js";

  interface TooltipRootProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /**
     * Delay in ms before the tooltip opens on hover.
     * Falls back to the enclosing TooltipProvider's delayDuration, then to 0.
     */
    delayDuration?: number;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    delayDuration,
    children,
  }: TooltipRootProps = $props();

  const provider = getProviderContext();

  const resolvedDelay = $derived(
    delayDuration !== undefined
      ? delayDuration
      : (provider?.delayDuration() ?? 0),
  );

  let triggerEl = $state<HTMLElement | null>(null);

  const contentId = `tooltip-content-${Math.random().toString(36).slice(2, 9)}`;

  createTooltipContext({
    open: () => open,
    setOpen: (v) => {
      open = v;
      onOpenChange?.(v);
    },
    triggerEl: () => triggerEl,
    setTriggerEl: (el) => {
      triggerEl = el;
    },
    delayDuration: () => resolvedDelay,
    contentId: () => contentId,
  });
</script>

{@render children?.()}
