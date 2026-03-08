<script lang="ts">
  import { getContext, untrack } from "svelte";
  import {
    TooltipContent,
    TooltipPositioner,
    type TooltipContentProps,
  } from "@ark-ui/svelte/tooltip";
  import { cn } from "$lib/utils";
  import type { PositioningOptions, Placement } from "@zag-js/popper";

  type Side = "top" | "bottom" | "left" | "right";
  type Align = "start" | "center" | "end";

  let {
    ref = $bindable(null),
    class: className,
    side,
    align,
    sideOffset,
    alignOffset,
    children,
    ...restProps
  }: TooltipContentProps & {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    alignOffset?: number;
  } = $props();

  const context = getContext<{ set: (v: PositioningOptions) => void }>(
    "tooltip",
  );

  const actualSide = $derived.by(() => side ?? "top");
  const actualAlign = $derived.by(() => align ?? "center");

  $effect(() => {
    if (context) {
      let placement: string = side ?? "top";
      if (align && align !== "center") {
        placement = `${placement}-${align}`;
      }

      let offset = { mainAxis: 0, crossAxis: 0 };
      // if (placement === "top") {
      //   offset.mainAxis = 24;
      //   offset.crossAxis = 0;
      // } else if (placement === "left" || placement === "right") {
      //   offset.mainAxis = 8;
      //   offset.crossAxis = -16;
      // } else if (placement === "bottom") {
      //   offset.mainAxis = -8;
      //   offset.crossAxis = 0;
      // }

      untrack(() => {
        context.set({ placement: placement as Placement, offset });
      });
    }
  });
</script>

<TooltipPositioner>
  <TooltipContent
    bind:ref
    data-side={actualSide}
    data-align={actualAlign}
    class={cn(
      "z-[60] max-w-70 rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground",
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
  </TooltipContent>
</TooltipPositioner>
