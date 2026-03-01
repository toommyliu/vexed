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
    "grid auto-rows-min grid-cols-[1fr_auto] grid-rows-[auto_auto] items-start gap-1.5 p-6",
    className,
  )}
  data-slot="card-header"
  {...restProps}
>
  {@render children?.()}
</div>
