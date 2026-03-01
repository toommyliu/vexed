<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "$lib/components/core/tooltip/";
  import { cn } from "$lib/utils";

  interface TooltipButtonProps extends HTMLButtonAttributes {
    /** The tooltip text or rich snippet to display. */
    tooltip: string | Snippet;
    children?: Snippet;
    /** Extra classes applied to the tooltip content. */
    contentClass?: string;
    /** Delay before the tooltip opens, in ms. Defaults to 0. */
    delayDuration?: number;
    /** Side the tooltip content appears on. */
    side?: "top" | "bottom" | "left" | "right";
    /** Offset from the trigger in px. */
    sideOffset?: number;
  }

  let {
    tooltip,
    children,
    class: className,
    contentClass,
    delayDuration = 0,
    side,
    sideOffset,
    ...restProps
  }: TooltipButtonProps = $props();
</script>

<TooltipProvider {delayDuration}>
  <Tooltip>
    <TooltipTrigger
      class={cn(
        "flex items-center rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        className,
      )}
      {...restProps}
    >
      {@render children?.()}
    </TooltipTrigger>
    <TooltipContent {side} {sideOffset} class={contentClass}>
      {#if typeof tooltip === "string"}
        {tooltip}
      {:else}
        {@render tooltip()}
      {/if}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
