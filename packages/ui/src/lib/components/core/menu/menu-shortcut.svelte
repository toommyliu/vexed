<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLElement> & { children?: Snippet } = $props();
</script>

<kbd
  class={cn(
    "ms-auto font-sans text-xs tracking-widest tabular-nums text-muted-foreground",
    className,
  )}
  data-slot="menu-shortcut"
  {...restProps}
>
  {@render children?.()}
</kbd>
