<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface TooltipArrowProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: className, children, ...restProps }: TooltipArrowProps = $props();
</script>

<div
  data-slot="tooltip-arrow"
  class={cn(
    "absolute h-2 w-2 rotate-45 bg-popover border-border",
    // Centering
    "group-data-[side=top]:left-[calc(50%-4px)] group-data-[side=bottom]:left-[calc(50%-4px)]",
    "group-data-[side=left]:top-[calc(50%-4px)] group-data-[side=right]:top-[calc(50%-4px)]",
    // When side is top, arrow is at bottom
    "group-data-[side=top]:-bottom-[5px] group-data-[side=top]:border-b group-data-[side=top]:border-r",
    // When side is bottom, arrow is at top
    "group-data-[side=bottom]:-top-[5px] group-data-[side=bottom]:border-t group-data-[side=bottom]:border-l",
    // When side is left, arrow is at right
    "group-data-[side=left]:-right-[5px] group-data-[side=left]:border-t group-data-[side=left]:border-r",
    // When side is right, arrow is at left
    "group-data-[side=right]:-left-[5px] group-data-[side=right]:border-b group-data-[side=right]:border-l",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
