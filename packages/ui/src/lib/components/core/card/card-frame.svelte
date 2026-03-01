<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let {
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();
</script>

<div
  class={cn(
    "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[15px] before:shadow-[0_1px_rgba(0,0,0,0.04)]",
    className,
  )}
  data-slot="card-frame"
  {...restProps}
>
  {@render children?.()}
</div>
