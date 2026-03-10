<script lang="ts">
  import { getContext, untrack } from "svelte";
  import {
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxItemText,
    type ComboboxItemProps,
  } from "@ark-ui/svelte/combobox";
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";

  type Props = Omit<ComboboxItemProps, "item"> & {
    value: string;
    label?: string;
    disabled?: boolean;
    ref?: HTMLElement | null;
  };

  let {
    value,
    label = value,
    disabled = false,
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();

  const item = $derived({ value, label, disabled });
  const comboboxContext = getContext<any>("combobox");

  $effect(() => {
    untrack(() => {
      if (comboboxContext) comboboxContext.registerItem(item);
    });

    return () => {
      untrack(() => {
        if (comboboxContext) comboboxContext.unregisterItem(value);
      });
    };
  });
</script>

<ComboboxItem
  {item}
  bind:ref
  data-slot="combobox-item"
  class={cn(
    "relative grid grid-cols-[1rem_1fr] w-full min-h-8 cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 ps-2 pe-3 text-sm outline-none",
    "data-[highlighted]:bg-muted",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    className,
  )}
  {...restProps}
>
  <ComboboxItemIndicator class="col-start-1 row-start-1">
    <Icon icon="check" size="md" class="shrink-0" />
  </ComboboxItemIndicator>
  <ComboboxItemText class="col-start-2 min-w-0 text-start">
    {#if children}
      {@render children()}
    {:else}
      {label ?? value}
    {/if}
  </ComboboxItemText>
</ComboboxItem>
