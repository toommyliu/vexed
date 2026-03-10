<script lang="ts">
  import { buttonVariants } from "$lib/components/core/button.svelte";
  import { cn } from "$lib/utils";
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

<DialogCloseTrigger
  bind:ref
  class={cn(buttonVariants({ variant: "destructive" }), className)}
  {...restProps}
>
  {@render children?.()}
</DialogCloseTrigger>
