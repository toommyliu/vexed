<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Placement } from "@floating-ui/dom";
  import { cn } from "$lib/utils";
  import { getTooltipContext } from "./tooltip-context.js";
  import { portal } from "$lib/actions/portal.js";
  import { floating } from "$lib/actions/floating.js";
  import { dismiss } from "$lib/actions/dismiss.js";

  interface TooltipContentProps {
    ref?: HTMLDivElement | null;
    class?: string;
    sideOffset?: number;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 4,
    side = "top",
    align = "center",
    children,
  }: TooltipContentProps = $props();

  const ctx = getTooltipContext();

  let open = $derived(ctx.open());
  let closing = $state(false);
  let visible = $derived(open || closing);
  const dataState = $derived(open ? "open" : "closed");

  let prevOpen = $state(false);
  $effect(() => {
    prevOpen = ctx.open();
  });
  $effect(() => {
    const cur = ctx.open();
    if (prevOpen && !cur) {
      closing = true;
      const t = setTimeout(() => {
        closing = false;
      }, 200);
      return () => clearTimeout(t);
    }
  });

  const placement = $derived<Placement>(
    align === "center" ? (side as Placement) : (`${side}-${align}` as Placement),
  );
</script>

{#if visible}
  <div
    bind:this={ref}
    id={ctx.contentId()}
    role="tooltip"
    data-slot="tooltip-content"
    data-state={dataState}
    use:portal={"body"}
    use:floating={{
      anchor: ctx.triggerEl(),
      placement,
      sideOffset,
    }}
    use:dismiss={{
      onDismiss: () => ctx.setOpen(false),
      closeOnOutside: false,
      closeOnEscape: true,
    }}
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
  >
    {@render children?.()}
  </div>
{/if}
