<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "../icons";
  import { getMenuContext } from "./menu-context.js";
  import { getSubMenuContext } from "./menu-context.js";
  import { onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  const baseClass = [
    "relative flex w-full cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none transition-colors",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "data-[highlighted]:bg-muted data-[state=open]:bg-muted",
  ].join(" ");

  interface MenuSubTriggerProps extends Omit<HTMLButtonAttributes, "children"> {
    ref?: HTMLButtonElement | null;
    class?: string;
    disabled?: boolean;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    disabled = false,
    children,
    ...restProps
  }: MenuSubTriggerProps = $props();

  const rootCtx = getMenuContext();
  const subCtx = getSubMenuContext();

  const isHighlighted = $derived(rootCtx.highlightedEl() === ref);
  const dataState = $derived(subCtx.open() ? "open" : "closed");

  // Register in parent menu's item list for root-level keyboard navigation
  $effect(() => {
    if (ref) rootCtx.registerItem(ref, disabled);
    return () => {
      if (ref) rootCtx.unregisterItem(ref);
    };
  });
  onDestroy(() => {
    if (ref) rootCtx.unregisterItem(ref);
  });

  $effect(() => {
    subCtx.setTriggerEl(ref);
    return () => subCtx.setTriggerEl(null);
  });

  let openTimeout: ReturnType<typeof setTimeout> | null = null;

  function clearOpenTimeout() {
    if (openTimeout) {
      clearTimeout(openTimeout);
      openTimeout = null;
    }
  }

  onDestroy(clearOpenTimeout);
</script>

<button
  bind:this={ref}
  type="button"
  role="menuitem"
  aria-haspopup="menu"
  aria-expanded={subCtx.open()}
  data-slot="menu-sub-trigger"
  data-state={dataState}
  data-highlighted={isHighlighted ? "" : undefined}
  data-disabled={disabled ? "" : undefined}
  {disabled}
  tabindex="-1"
  onpointerenter={() => {
    if (!disabled && ref) {
      rootCtx.setHighlightedEl(ref);
      // Cancel any in-flight scheduled close from previous leave
      subCtx.cancelScheduledClose();
      // Open after a short delay to avoid jitter
      clearOpenTimeout();
      openTimeout = setTimeout(() => subCtx.setOpen(true), 100);
    }
  }}
  onpointerleave={() => {
    clearOpenTimeout();
    if (subCtx.open()) {
      // Schedule a close — safe-triangle in sub-content may cancel it
      subCtx.scheduleClose(300);
    }
  }}
  onclick={(e) => {
    e.stopPropagation();
    if (disabled) return;
    subCtx.setOpen(!subCtx.open());
  }}
  onkeydown={(e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      subCtx.setOpen(true);
    }
  }}
  class={cn(baseClass, className)}
  {...restProps}
>
  {@render children?.()}
  <Icon icon="chevron_right" class="ml-auto size-4" />
</button>
