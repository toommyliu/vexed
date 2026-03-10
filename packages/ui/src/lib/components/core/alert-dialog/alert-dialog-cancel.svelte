<script lang="ts">
  import {
    DialogCloseTrigger,
    type DialogCloseTriggerProps,
  } from "@ark-ui/svelte/dialog";

  import { buttonVariants } from "$lib/components/core/button.svelte";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: DialogCloseTriggerProps = $props();
</script>

<DialogCloseTrigger
  bind:ref
  class={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
  {...restProps}
>
  {@render children?.()}
</DialogCloseTrigger>
