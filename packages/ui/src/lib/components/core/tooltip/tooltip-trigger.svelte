<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { getTooltipContext } from "./tooltip-context.svelte";

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

  const state = getTooltipContext();

  $effect(() => {
    state.setTriggerEl(ref);
  });

  function onMouseEnter() {
    if (disabled) return;
    state.show();
  }

  function onMouseLeave() {
    state.hide();
  }

  function onFocus() {
    if (disabled) return;
    state.show();
  }

  function onBlur() {
    state.hide();
  }

  function onKeyDown(e: KeyboardEvent) {
    state.handleKeyDown(e);
    // @ts-ignore
    restProps.onkeydown?.(e);
  }

  const triggerProps = $derived({
    "data-tooltip-id": state.contentId,
    "aria-describedby": state.open ? state.contentId : undefined,
    "data-state": state.open ? "open" : "closed",
    onmouseenter: onMouseEnter,
    onmouseleave: onMouseLeave,
    onfocus: onFocus,
    onblur: onBlur,
    onkeydown: onKeyDown,
    disabled,
    class: className,
    ref: (el: HTMLElement | null) => {
      ref = el as any;
      state.setTriggerEl(el);
    },
    ...restProps,
  });
</script>

{#if child}
  {@render child({ props: { ...triggerProps } })}
{:else}
  <button bind:this={ref} data-slot="tooltip-trigger" {...triggerProps}>
    {@render children?.()}
  </button>
{/if}
