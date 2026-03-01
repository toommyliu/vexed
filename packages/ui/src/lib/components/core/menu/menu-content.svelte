<script lang="ts">
  import { cn } from "$lib/utils";
  import { getMenuContext } from "./menu-context.js";
  import { portal } from "$lib/actions/portal.js";
  import { floating } from "$lib/actions/floating.js";
  import { dismiss } from "$lib/actions/dismiss.js";
  import type { Snippet } from "svelte";
  import type { Placement } from "@floating-ui/dom";

  interface MenuContentProps {
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
    sideOffset = 6,
    side = "bottom",
    align = "start",
    children,
  }: MenuContentProps = $props();

  const ctx = getMenuContext();

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
</script>

{#if visible}
  <div
    bind:this={ref}
    role="menu"
    aria-orientation="vertical"
    data-slot="menu-content"
    data-state={dataState}
    tabindex="-1"
    use:portal={"body"}
    use:floating={{
      anchor: ctx.triggerEl(),
      placement,
      sideOffset,
    }}
    use:dismiss={{
      onDismiss: () => ctx.setOpen(false),
      excludeElements: () => [ctx.triggerEl()],
    }}
    {onkeydown}
    class={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border/60 bg-popover p-1 text-popover-foreground shadow-md outline-none",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-97 data-[state=open]:zoom-in-98 duration-200 ease-out",
      "data-[side=bottom]:slide-in-from-top-1 data-[side=bottom]:slide-out-to-top-1 data-[side=left]:slide-in-from-right-1 data-[side=left]:slide-out-to-right-1 data-[side=right]:slide-in-from-left-1 data-[side=right]:slide-out-to-left-1 data-[side=top]:slide-in-from-bottom-1 data-[side=top]:slide-out-to-bottom-1 transition-none",
      className,
    )}
  >
    {@render children?.()}
  </div>
{/if}
