<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  interface SelectGroupLabelProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let {
    class: className = undefined,
    children,
    ...restProps
  }: SelectGroupLabelProps = $props();
</script>

<div
  data-slot="select-group-label"
  class={cn("px-2 py-1.5 font-medium text-muted-foreground text-xs", className)}
  {...restProps}
>
  {@render children?.()}
</div>
