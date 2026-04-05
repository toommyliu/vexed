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
  class={cn("font-semibold text-sm", className)}
  data-slot="card-frame-title"
  {...restProps}
>
  {@render children?.()}
</div>
