<script lang="ts">
  import { cn } from "$lib/util/cn";
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
    "relative flex flex-col gap-6 rounded-xl bg-card text-card-foreground shadow-sm py-6",
    className
  )}
  data-slot="card"
  {...restProps}
>
  {@render children?.()}
</div>
