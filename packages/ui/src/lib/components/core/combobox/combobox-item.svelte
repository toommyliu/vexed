<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getComboboxContext } from "./combobox-context.js";
  import { onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface ComboboxItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    ref?: HTMLDivElement | null;
    value: string;
    label?: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className = undefined,
    value,
    label,
    disabled = false,
    children,
    ...restProps
  }: ComboboxItemProps = $props();

  const ctx = getComboboxContext();

  const isSelected = $derived(ctx.value() === value);
  const isHighlighted = $derived(ctx.highlightedValue() === value);

  // Extract text label for item registry
  let labelEl = $state<HTMLSpanElement | null>(null);

  $effect(() => {
    const resolvedLabel = labelEl?.textContent?.trim() || label || value;
    ctx.registerItem(value, resolvedLabel, disabled);
    return () => ctx.unregisterItem(value);
  });

  onDestroy(() => ctx.unregisterItem(value));
</script>

<!-- Hidden span to capture text label -->
<span bind:this={labelEl} style="display:none" aria-hidden="true">
  {@render children?.()}
</span>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  bind:this={ref}
  role="option"
  aria-selected={isSelected}
  aria-disabled={disabled}
  data-slot="combobox-item"
  data-highlighted={isHighlighted ? "" : undefined}
  data-disabled={disabled ? "" : undefined}
  onclick={() => {
    if (!disabled) {
      const resolvedLabel = labelEl?.textContent?.trim() || label || value;
      ctx.setValue(value, resolvedLabel);
    }
  }}
  onpointerenter={() => {
    if (!disabled) ctx.setHighlightedValue(value);
  }}
  onpointerleave={() => {
    if (ctx.highlightedValue() === value) ctx.setHighlightedValue(null);
  }}
  {...restProps}
  class={cn(
    "relative grid grid-cols-[1rem_1fr] w-full min-h-8 cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 ps-2 pe-3 text-sm outline-none",
    "data-[highlighted]:bg-muted",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    className,
  )}
>
  {#if isSelected}
    <Icon icon="check" size="md" class="col-start-1 row-start-1 shrink-0" />
  {/if}
  <span class="col-start-2 min-w-0 text-start">
    {#if children}
      {@render children()}
    {:else}
      {label ?? value}
    {/if}
  </span>
</div>
