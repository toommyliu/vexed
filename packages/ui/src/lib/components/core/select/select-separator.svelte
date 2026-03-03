<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className = undefined,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  class={cn("mx-2 my-1 h-px bg-border", className)}
  data-slot="select-separator"
  role="separator"
  {...restProps}
></div>
