<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";
  import { getTooltipContext } from "./tooltip-context.js";

  interface TooltipTriggerProps extends HTMLButtonAttributes {
    ref?: HTMLButtonElement | null;
    class?: string;
    children?: Snippet;
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  }

  let {
    ref = $bindable(null),
    class: className,
    child,
    children,
    disabled,
    ...restProps
  }: TooltipTriggerProps = $props();

  const ctx = getTooltipContext();

  let openTimer: ReturnType<typeof setTimeout> | null = null;

  function cancelTimer() {
    if (openTimer !== null) {
      clearTimeout(openTimer);
      openTimer = null;
    }
  }

  function scheduleOpen() {
    cancelTimer();
    const delay = ctx.delayDuration();
    if (delay <= 0) {
      ctx.setOpen(true);
    } else {
      openTimer = setTimeout(() => ctx.setOpen(true), delay);
    }
  }

  function closeTooltip() {
    cancelTimer();
    ctx.setOpen(false);
  }

  const triggerProps = $derived({
    onmouseenter: scheduleOpen,
    onmouseleave: closeTooltip,
    onfocus: scheduleOpen,
    onblur: closeTooltip,
    "aria-describedby": ctx.contentId(),
  });

  $effect(() => {
    ctx.setTriggerEl(ref);
    return () => ctx.setTriggerEl(null);
  });
</script>

{#if child}
  {@render child({ props: triggerProps })}
{:else}
  <button
    bind:this={ref}
    type="button"
    data-slot="tooltip-trigger"
    {disabled}
    onmouseenter={scheduleOpen}
    onmouseleave={closeTooltip}
    onfocus={scheduleOpen}
    onblur={closeTooltip}
    aria-describedby={ctx.contentId()}
    class={cn(className)}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
