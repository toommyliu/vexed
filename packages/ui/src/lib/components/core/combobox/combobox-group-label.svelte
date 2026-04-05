<script lang="ts">
  import {
    ComboboxItemGroupLabel,
    type ComboboxItemGroupLabelProps,
  } from "@ark-ui/svelte/combobox";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxItemGroupLabelProps = $props();
</script>

<ComboboxItemGroupLabel
  bind:ref
  data-slot="combobox-group-label"
  class={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</ComboboxItemGroupLabel>
