<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getMenuContext, getRadioGroupContext } from "./menu-context.js";
  import { onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface MenuRadioItemProps extends Omit<HTMLButtonAttributes, "children"> {
    ref?: HTMLButtonElement | null;
    value: string;
    disabled?: boolean;
    closeOnSelect?: boolean;
    onSelect?: () => void;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    value,
    disabled = false,
    closeOnSelect = true,
    onSelect,
    children: label,
    ...restProps
  }: MenuRadioItemProps = $props();

  const ctx = getMenuContext();
  const radioCtx = getRadioGroupContext();

  const isChecked = $derived(radioCtx.value() === value);
  const isHighlighted = $derived(ctx.highlightedEl() === ref);

  $effect(() => {
    if (ref) ctx.registerItem(ref, disabled);
    return () => {
      if (ref) ctx.unregisterItem(ref);
    };
  });
  onDestroy(() => {
    if (ref) ctx.unregisterItem(ref);
  });
</script>

<button
  bind:this={ref}
  type="button"
  role="menuitemradio"
  aria-checked={isChecked}
  data-slot="menu-radio-item"
  data-highlighted={isHighlighted ? "" : undefined}
  data-disabled={disabled ? "" : undefined}
  {disabled}
  tabindex="-1"
  onpointerenter={() => {
    if (!disabled && ref) ctx.setHighlightedEl(ref);
  }}
  onpointerleave={() => {
    if (ctx.highlightedEl() === ref) ctx.setHighlightedEl(null);
  }}
  onclick={() => {
    if (disabled) return;
    radioCtx.setValue(value);
    onSelect?.();
    if (closeOnSelect) ctx.closeAll();
  }}
  class={cn(
    "relative flex w-full cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none transition-colors",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "data-[highlighted]:bg-muted",
    className,
  )}
  {...restProps}
>
  <span class="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
    {#if isChecked}
      <Icon icon="check" size="xs" />
    {/if}
  </span>
  {@render label?.()}
</button>
