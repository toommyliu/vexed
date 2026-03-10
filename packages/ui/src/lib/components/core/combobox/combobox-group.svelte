<script lang="ts">
  import {
    ComboboxItemGroup,
    type ComboboxItemGroupProps,
  } from "@ark-ui/svelte/combobox";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxItemGroupProps = $props();
</script>

<ComboboxItemGroup
  bind:ref
  data-slot="combobox-group"
  class={cn(
    "overflow-hidden text-foreground [[role=group]+&]:mt-1.5",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</ComboboxItemGroup>
