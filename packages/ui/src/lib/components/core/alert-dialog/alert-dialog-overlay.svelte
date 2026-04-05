<script lang="ts">
  import {
    DialogBackdrop,
    type DialogBackdropProps,
  } from "@ark-ui/svelte/dialog";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: DialogBackdropProps = $props();
</script>

<DialogBackdrop
  bind:ref
  class={cn(
    "fixed inset-0 z-50 bg-black/32 duration-150 backdrop-blur-[1px] transition-opacity",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    className,
  )}
  {...restProps}
/>
