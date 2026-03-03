<script lang="ts">
  import {
    ComboboxList,
    type ComboboxListProps,
  } from "@ark-ui/svelte/combobox";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxListProps = $props();
</script>

<ComboboxList
  bind:ref
  data-slot="combobox-list"
  class={cn(
    "max-h-60 min-w-[8rem] w-[var(--combobox-anchor-width)] overflow-y-auto p-1",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</ComboboxList>
