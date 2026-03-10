<script lang="ts">
  import {
    SelectItemGroupLabel,
    type SelectItemGroupLabelProps,
  } from "@ark-ui/svelte/select";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: SelectItemGroupLabelProps = $props();
</script>

<SelectItemGroupLabel
  bind:ref
  data-slot="select-group-label"
  class={cn("px-2 py-1.5 font-medium text-muted-foreground text-xs", className)}
  {...restProps}
>
  {@render children?.()}
</SelectItemGroupLabel>
