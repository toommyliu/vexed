<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface SelectGroupProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let {
    class: className = undefined,
    children,
    ...restProps
  }: SelectGroupProps = $props();
</script>

<div role="group" data-slot="select-group" class={className} {...restProps}>
  {@render children?.()}
</div>
