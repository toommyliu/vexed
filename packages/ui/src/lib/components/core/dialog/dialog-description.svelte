<script lang="ts">
  import {
    DialogDescription,
    type DialogDescriptionProps,
  } from "@ark-ui/svelte/dialog";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: DialogDescriptionProps = $props();
</script>

<DialogDescription
  bind:ref
  class={cn("text-muted-foreground text-sm", className)}
  {...restProps}
>
  {@render children?.()}
</DialogDescription>
