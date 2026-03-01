<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
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

  let wrapperEl: HTMLSpanElement | null = null;

  $effect(() => {
    ctx.setTriggerEl(wrapperEl);
    return () => ctx.setTriggerEl(null);
  });
</script>

<span
  bind:this={wrapperEl}
  class={className}
  onmouseenter={scheduleOpen}
  onmouseleave={closeTooltip}
  onfocus={scheduleOpen}
  onblur={closeTooltip}
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-disabled={disabled}
  aria-describedby={ctx.contentId()}
>
  {#if child}
    {@render child({
      props: {
        ref,
        ...restProps,
        onmouseenter: scheduleOpen,
        onmouseleave: closeTooltip,
        onfocus: scheduleOpen,
        onblur: closeTooltip,
        "aria-describedby": ctx.contentId(),
      },
    })}
  {:else}
    <button type="button" data-slot="tooltip-trigger" {disabled} {...restProps}>
      {@render children?.()}
    </button>
  {/if}
</span>
