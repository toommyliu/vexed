<script lang="ts">
  import { getTooltipContext } from "./tooltip-context.svelte";
  import { cn } from "$lib/utils";
  import { floating } from "$lib/actions/floating";
  import type { Placement } from "@floating-ui/dom";
  import { portal, type PortalTarget } from "$lib/actions/portal";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Side = "top" | "bottom" | "left" | "right";
  type Align = "start" | "center" | "end";

  interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
    ref?: HTMLDivElement | null;
    side?: Side;
    align?: Align;
    sideOffset?: number;
    alignOffset?: number;
    portalled?: boolean;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    side = "top",
    align = "center",
    sideOffset = 4,
    alignOffset = 0,
    portalled = true,
    children,
    ...restProps
  }: TooltipContentProps = $props();

  const state = getTooltipContext();

  const placement = $derived.by(() => {
    let p: string = side;
    if (align && align !== "center") {
      p = `${p}-${align}`;
    }
    return p as Placement;
  });

  const actualSide = $derived(side);
  const actualAlign = $derived(align);
</script>

{#if state.open}
  <div
    bind:this={ref}
    use:portal={portalled ? "body" : undefined}
    use:floating={{ 
      anchor: state.triggerEl, 
      placement, 
      sideOffset 
    }}
    role="tooltip"
    id={state.contentId}
    data-side={actualSide}
    data-align={actualAlign}
    data-state={state.open ? "open" : "closed"}
    onmouseenter={() => state.show()}
    onmouseleave={() => state.hide()}
    class={cn(
      "group z-[60] max-w-70 rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2",
      "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
      "data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
      "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2",
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
  </div>
{/if}
