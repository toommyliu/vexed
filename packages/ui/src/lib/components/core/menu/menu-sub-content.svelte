<script lang="ts">
  import { cn } from "$lib/utils";
  import { getSubMenuContext } from "./menu-context.js";
  import { portal } from "$lib/actions/portal.js";
  import { floating } from "$lib/actions/floating.js";
  import { dismiss } from "$lib/actions/dismiss.js";
  import type { Snippet } from "svelte";
  import type { Placement } from "@floating-ui/dom";

  interface MenuSubContentProps {
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
    sideOffset = 2,
    side = "right",
    align = "start",
    children,
  }: MenuSubContentProps = $props();

  const ctx = getSubMenuContext();

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

  $effect(() => {
    ctx.setContentEl(ref);
    return () => ctx.setContentEl(null);
  });

  const placement = $derived<Placement>(
    align === "center"
      ? (side as Placement)
      : (`${side}-${align}` as Placement),
  );

  function moveFocus(dir: 1 | -1) {
    const items = ctx.getItems().filter((i) => !i.disabled);
    if (!items.length) return;
    const cur = ctx.highlightedEl();
    const idx = items.findIndex((i) => i.el === cur);
    const next = items[(idx + dir + items.length) % items.length];
    ctx.setHighlightedEl(next.el);
    next.el.scrollIntoView({ block: "nearest" });
  }

  function onkeydown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "Home":
        e.preventDefault();
        {
          const items = ctx.getItems().filter((i) => !i.disabled);
          if (items.length) {
            ctx.setHighlightedEl(items[0].el);
            items[0].el.scrollIntoView({ block: "nearest" });
          }
        }
        break;
      case "End":
        e.preventDefault();
        {
          const items = ctx.getItems().filter((i) => !i.disabled);
          if (items.length) {
            const last = items[items.length - 1];
            ctx.setHighlightedEl(last.el);
            last.el.scrollIntoView({ block: "nearest" });
          }
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        {
          const cur = ctx.highlightedEl();
          if (cur) cur.click();
        }
        break;
      case "Escape":
      case "ArrowLeft":
      case "Tab":
        e.preventDefault();
        ctx.setOpen(false);
        ctx.triggerEl()?.focus();
        break;
    }
  }

  $effect(() => {
    if (open && ref) {
      requestAnimationFrame(() => {
        const items = ctx.getItems().filter((i) => !i.disabled);
        if (items.length) ctx.setHighlightedEl(items[0].el);
        ref?.focus();
      });
    }
  });

  // "Safe Triangle" logic:
  // While the pointer moves from the sub-trigger toward the sub-content, it
  // briefly crosses empty space. We keep the sub open as long as the pointer
  // is inside the triangle formed by the last known trigger-edge point and the
  // two near corners of the content rect.

  let lastPointerY = 0;

  function sign(
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number,
  ): number {
    return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
  }

  function pointInTriangle(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ): boolean {
    const d1 = sign(px, py, ax, ay, bx, by);
    const d2 = sign(px, py, bx, by, cx, cy);
    const d3 = sign(px, py, cx, cy, ax, ay);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  $effect(() => {
    if (!open) return;

    function onPointermove(e: PointerEvent) {
      lastPointerY = e.clientY;

      const triggerEl = ctx.triggerEl();
      const contentEl = ctx.contentEl();
      if (!triggerEl || !contentEl) return;

      const tr = triggerEl.getBoundingClientRect();
      const cr = contentEl.getBoundingClientRect();

      // Triangle apex: right edge of trigger at current pointer Y
      // (the point where pointer exits the trigger toward the sub-content)
      const apexX = tr.right;
      const apexY = lastPointerY;

      // Two near corners of sub-content (its left edge when side=right)
      const c1x = cr.left;
      const c1y = cr.top;
      const c2x = cr.left;
      const c2y = cr.bottom;

      const inTriangle = pointInTriangle(
        e.clientX,
        e.clientY,
        apexX,
        apexY,
        c1x,
        c1y,
        c2x,
        c2y,
      );

      if (inTriangle) {
        // Pointer is crossing toward sub-content — cancel any pending close
        ctx.cancelScheduledClose();
      }
    }

    document.addEventListener("pointermove", onPointermove);
    return () => document.removeEventListener("pointermove", onPointermove);
  });
</script>

{#if visible}
  <div
    bind:this={ref}
    role="menu"
    aria-orientation="vertical"
    data-slot="menu-sub-content"
    data-state={dataState}
    tabindex="-1"
    use:portal={"body"}
    use:floating={{
      anchor: ctx.triggerEl(),
      placement,
      sideOffset,
    }}
    use:dismiss={{ onDismiss: () => ctx.setOpen(false) }}
    {onkeydown}
    onpointerenter={() => {
      // Pointer is now inside sub-content — cancel any pending close
      ctx.cancelScheduledClose();
    }}
    onpointerleave={() => {
      // Pointer left sub-content — schedule a close (sub-trigger will
      // cancel it again if re-entered)
      ctx.scheduleClose(200);
    }}
    class={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border/60 bg-popover p-1 text-popover-foreground shadow-md outline-none",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-97 data-[state=open]:zoom-in-98 duration-200 ease-out transition-none",
      className,
    )}
  >
    {@render children?.()}
  </div>
{/if}
