<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  type Orientation = "vertical" | "horizontal";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    orientation?: Orientation;
    children?: Snippet;
  }

  let {
    class: className = undefined,
    orientation = "vertical",
    children,
    ...restProps
  }: Props = $props();
</script>

<div
  class={cn(
    "flex bg-background",
    orientation === "vertical" ? "h-screen flex-col" : "h-screen w-screen flex-row",
    className,
  )}
  data-slot="app-frame"
  data-orientation={orientation}
  {...restProps}
>
  {@render children?.()}
</div>
