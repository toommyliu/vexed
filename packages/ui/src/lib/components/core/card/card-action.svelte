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
  class={cn("col-start-2 row-span-2 row-start-1 inline-flex self-start justify-self-end", className)}
  data-slot="card-action"
  {...restProps}
>
  {@render children?.()}
</div>
