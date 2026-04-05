<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  let {
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();
</script>

<div
  data-slot="command-footer"
  class={cn(
    "flex items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
