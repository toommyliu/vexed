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
  data-slot="command-panel"
  class={cn(
    "relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-sm outline-none",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[0_1px_0_rgba(0,0,0,0.04)]",
    "dark:before:shadow-[0_-1px_0_rgba(255,255,255,0.08)]",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
