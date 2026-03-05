<script lang="ts" generics="T">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getContext, untrack } from "svelte";
  import {
    SelectItem,
    SelectItemIndicator,
    SelectItemText,
    type SelectItemProps,
  } from "@ark-ui/svelte/select";
  import type { SelectContext } from "./context";

  type Props = Omit<SelectItemProps, "item"> & {
    value: T;
    label?: string;
    disabled?: boolean;
    ref?: HTMLElement | null;
  };

  let {
    value,
    label = value as unknown as string,
    disabled = false,
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();

  const item = $derived({ value, label, disabled });
  const selectContext = getContext<SelectContext<T>>("select");

  $effect.pre(() => {
    untrack(() => {
      if (selectContext) selectContext.registerItem(item);
    });

    return () => {
      untrack(() => {
        if (selectContext) selectContext.unregisterItem(value);
      });
    };
  });
</script>

<SelectItem
  {item}
  bind:ref
  data-slot="select-item"
  class={cn(
    "relative grid grid-cols-[1rem_1fr] w-full cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 px-2 text-sm outline-none",
    "data-[highlighted]:bg-muted",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    className,
  )}
  {...restProps}
>
  <SelectItemIndicator class="col-start-1 row-start-1">
    <Icon icon="check" size="md" class="shrink-0" />
  </SelectItemIndicator>
  <SelectItemText class="col-start-2 min-w-0 text-start">
    {@render children?.()}
  </SelectItemText>
</SelectItem>
