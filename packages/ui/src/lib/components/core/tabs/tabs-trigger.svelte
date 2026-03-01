<script lang="ts">
  import { cn } from "$lib/utils";
  import { getTabsContext } from "./tabs-context.js";
  import { onDestroy } from "svelte";
  import type { Snippet } from "svelte";

  interface TabsTriggerProps {
    ref?: HTMLButtonElement | null;
    value: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    value,
    disabled = false,
    class: className,
    children,
  }: TabsTriggerProps = $props();

  const ctx = getTabsContext();
  const isActive = $derived(ctx.value() === value);
  const state = $derived(isActive ? "active" : "inactive");

  $effect(() => {
    if (ref) {
      ctx.registerTrigger(value, ref);
    }
    return () => {
      ctx.unregisterTrigger(value);
    };
  });

  onDestroy(() => {
    ctx.unregisterTrigger(value);
  });

  function activate() {
    if (!disabled) ctx.setValue(value);
  }

  function onkeydown(e: KeyboardEvent) {
    if (!ref) return;
    const list = ref.closest('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>(
        '[data-slot="tabs-trigger"]:not([disabled])',
      ),
    );
    const idx = tabs.indexOf(ref);
    const isVertical = ctx.orientation() === "vertical";

    let next = -1;
    if (e.key === (isVertical ? "ArrowDown" : "ArrowRight")) {
      next = (idx + 1) % tabs.length;
    } else if (e.key === (isVertical ? "ArrowUp" : "ArrowLeft")) {
      next = (idx - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = tabs.length - 1;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
      return;
    }

    if (next !== -1) {
      e.preventDefault();
      tabs[next].focus();
      // Activate on arrow key (roving tabindex pattern — auto-activate)
      const nextValue = tabs[next].dataset.value;
      if (nextValue) ctx.setValue(nextValue);
    }
  }
</script>

<button
  bind:this={ref}
  type="button"
  role="tab"
  aria-selected={isActive}
  data-slot="tabs-trigger"
  data-state={state}
  data-value={value}
  data-orientation={ctx.orientation()}
  {disabled}
  tabindex={isActive ? 0 : -1}
  onclick={activate}
  {onkeydown}
  class={cn(
    "relative z-10 flex h-9 sm:h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2.5 font-medium text-base sm:text-sm outline-none transition-[color,background-color,box-shadow] select-none",
    "hover:text-foreground/60 group-data-[variant=underline]/tabs-list:hover:bg-accent/40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-64",
    "data-[state=active]:text-foreground",
    "data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start",
    "[&_svg:not([class*='size-'])]:size-[1.125rem] sm:[&_svg:not([class*='size-'])]:size-4",
    className,
  )}
>
  {@render children?.()}
</button>
