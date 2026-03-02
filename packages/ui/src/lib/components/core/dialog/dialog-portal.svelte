<script lang="ts">
  import {
    Positioner,
    type DialogPositionerProps,
  } from "@ark-ui/svelte/dialog";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: DialogPositionerProps = $props();
</script>

<Positioner bind:ref class={className} {...restProps}>
  {@render children?.()}
</Positioner>
