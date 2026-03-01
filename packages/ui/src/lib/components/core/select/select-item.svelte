<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getSelectContext } from "./select-context.js";
  import { onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface SelectItemProps extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "children"
  > {
    ref?: HTMLDivElement | null;
    value: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className = undefined,
    value,
    disabled = false,
    children,
    ...restProps
  }: SelectItemProps = $props();

  const ctx = getSelectContext();

  const isSelected = $derived(ctx.value() === value);
  const isHighlighted = $derived(ctx.highlightedValue() === value);

  let labelEl = $state<HTMLSpanElement | null>(null);

  $effect(() => {
    const label = labelEl?.textContent?.trim() ?? value;
    ctx.registerItem(value, label, disabled);
    return () => ctx.unregisterItem(value);
  });

  onDestroy(() => ctx.unregisterItem(value));
</script>

<span bind:this={labelEl} style="display:none" aria-hidden="true">
  {@render children?.()}
</span>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  bind:this={ref}
  role="option"
  aria-selected={isSelected}
  aria-disabled={disabled}
  data-slot="select-item"
  data-highlighted={isHighlighted ? "" : undefined}
  data-disabled={disabled ? "" : undefined}
  onclick={() => {
    if (!disabled) {
      const label = labelEl?.textContent?.trim() ?? value;
      ctx.setValue(value, label);
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
    "relative grid grid-cols-[1rem_1fr] w-full cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 px-2 text-sm outline-none",
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
    {@render children?.()}
  </span>
</div>
