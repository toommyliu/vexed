<script lang="ts">
  import { cn } from "$lib/utils";
  import { getMenuContext } from "./menu-context.js";
  import { onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "../icons/icon.svelte";
  import Switch from "../switch.svelte";

  interface MenuCheckboxItemProps extends Omit<
    HTMLButtonAttributes,
    "children"
  > {
    ref?: HTMLButtonElement | null;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    variant?: "default" | "switch";
    closeOnSelect?: boolean;
    onSelect?: () => void;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    onCheckedChange,
    disabled = false,
    variant = "default",
    closeOnSelect = false,
    onSelect,
    children: label,
    ...restProps
  }: MenuCheckboxItemProps = $props();

  const ctx = getMenuContext();
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
  role="menuitemcheckbox"
  aria-checked={checked}
  data-slot="menu-checkbox-item"
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
    checked = !checked;
    onCheckedChange?.(checked);
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
  {#if variant === "switch"}
    {@render label?.()}
    <Switch {checked} size="sm" />
  {:else}
    <span class="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
      {#if checked}
        <Icon icon="check" size="sm" />
      {/if}
    </span>
    {@render label?.()}
  {/if}
</button>
