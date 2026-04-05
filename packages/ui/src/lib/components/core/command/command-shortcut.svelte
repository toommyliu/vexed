<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLElement> {
    class?: string;
  }

  let { class: className = undefined, children, ...restProps }: Props = $props();
</script>

<kbd
  data-slot="command-shortcut"
  class={cn(
    "ml-auto text-xs font-medium tracking-widest text-muted-foreground opacity-70",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</kbd>
