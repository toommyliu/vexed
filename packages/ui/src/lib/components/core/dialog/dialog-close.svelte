<script lang="ts">
  import {
    DialogCloseTrigger,
    type DialogCloseTriggerProps,
  } from "@ark-ui/svelte/dialog";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: DialogCloseTriggerProps = $props();
</script>

<DialogCloseTrigger bind:ref class={className} {...restProps}>
  {@render children?.()}
</DialogCloseTrigger>
