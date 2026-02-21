<script lang="ts">
  import { cn } from "$lib/util/cn";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {}

  let {
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();
</script>

<div
  class={cn("px-2 py-1 text-sm font-semibold text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</div>
