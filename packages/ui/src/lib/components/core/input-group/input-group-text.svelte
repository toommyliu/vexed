<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    ref?: HTMLSpanElement;
  }

  let {
    class: className,
    ref = $bindable(),
    children,
    ...props
  }: Props = $props();
</script>

<span
  bind:this={ref}
  class={cn(
    "flex items-center gap-2 text-muted-foreground leading-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
    className,
  )}
  data-slot="input-group-text"
  {...props}
>
  {@render children?.()}
</span>
