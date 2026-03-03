<script lang="ts">
  import {
    SelectItemGroup,
    type SelectItemGroupProps,
  } from "@ark-ui/svelte/select";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: SelectItemGroupProps = $props();
</script>

<SelectItemGroup data-slot="select-group" class={className} {...restProps}>
  {@render children?.()}
</SelectItemGroup>
