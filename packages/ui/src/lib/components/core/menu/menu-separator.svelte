<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  interface MenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {
    ref?: HTMLDivElement | null;
    class?: string;
  }

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: MenuSeparatorProps = $props();
</script>

<div
  bind:this={ref}
  role="separator"
  data-slot="menu-separator"
  class={cn("-mx-1 my-1 h-px bg-border/40", className)}
  {...restProps}
></div>
