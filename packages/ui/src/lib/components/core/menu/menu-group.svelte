<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface MenuGroupProps extends HTMLAttributes<HTMLDivElement> {
    ref?: HTMLDivElement | null;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: MenuGroupProps = $props();
</script>

<div bind:this={ref} role="group" data-slot="menu-group" {...restProps}>
  {@render children?.()}
</div>
