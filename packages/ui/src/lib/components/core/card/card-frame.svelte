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

<!--
  Card.Frame groups multiple Card.Root children into a stacked card group.
  Add class="rounded-none border-0 border-b last:border-b-0 shadow-none" to each
  inner Card.Root to achieve the flush grouped appearance.
-->
<div
  class={cn(
    "relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[15px] before:shadow-[0_1px_rgba(0,0,0,0.04)]",
    className,
  )}
  data-slot="card-frame"
  {...restProps}
>
  {@render children?.()}
</div>
