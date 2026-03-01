<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getSelectContext } from "./select-context.js";
  import { portal } from "$lib/actions/portal.js";
  import { floating } from "$lib/actions/floating.js";
  import { dismiss } from "$lib/actions/dismiss.js";
  import { tick, type Snippet } from "svelte";
  import type { Placement } from "@floating-ui/dom";

  interface SelectContentProps {
    ref?: HTMLDivElement | null;
    class?: string;
    sideOffset?: number;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className = undefined,
    sideOffset = 4,
    side = "bottom",
    align = "start",
    children,
  }: SelectContentProps = $props();

  const ctx = getSelectContext();

  const open = $derived(ctx.open());
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
    align === "center"
      ? (side as Placement)
      : (`${side}-${align}` as Placement),
  );

  let viewportEl = $state<HTMLDivElement | null>(null);
  let canScrollUp = $state(false);
  let canScrollDown = $state(false);

  function updateScrollState() {
    if (!viewportEl) return;
    canScrollUp = viewportEl.scrollTop > 0;
    canScrollDown =
      viewportEl.scrollTop + viewportEl.clientHeight <
      viewportEl.scrollHeight - 1;
  }

  $effect(() => {
    if (!viewportEl) return;
    updateScrollState();
    viewportEl.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(viewportEl);
    return () => {
      viewportEl?.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  });

  function scrollUp() {
    viewportEl?.scrollBy({ top: -80, behavior: "smooth" });
  }

  function scrollDown() {
    viewportEl?.scrollBy({ top: 80, behavior: "smooth" });
  }

  function onkeydown(e: KeyboardEvent) {
    const items = ctx.getItems().filter((i) => !i.disabled);
    if (!items.length) return;
    const cur = ctx.highlightedValue();
    const idx = items.findIndex((i) => i.value === cur);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      ctx.setHighlightedValue(items[(idx + 1) % items.length].value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      ctx.setHighlightedValue(
        items[(idx - 1 + items.length) % items.length].value,
      );
    } else if (e.key === "Home") {
      e.preventDefault();
      ctx.setHighlightedValue(items[0].value);
    } else if (e.key === "End") {
      e.preventDefault();
      ctx.setHighlightedValue(items[items.length - 1].value);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const highlighted = ctx.highlightedValue();
      if (highlighted) {
        const item = ctx.getItems().find((i) => i.value === highlighted);
        if (item) ctx.setValue(item.value, item.label);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      ctx.setOpen(false);
      ctx.triggerEl()?.focus();
    }
  }

  // When opened, highlight the currently selected value (or first item) and focus content
  $effect(() => {
    if (open) {
      const items = ctx.getItems().filter((i) => !i.disabled);
      const cur = ctx.value();
      const match = items.find((i) => i.value === cur);
      ctx.setHighlightedValue(match?.value ?? items[0]?.value ?? null);
      if (ref) {
        requestAnimationFrame(() => {
          ref?.focus();
        });
      }
    }
  });

  // Scroll highlighted item into view within the viewport
  $effect(() => {
    const hv = ctx.highlightedValue();
    if (hv && viewportEl) {
      tick().then(() => {
        const el = viewportEl?.querySelector("[data-highlighted]");
        el?.scrollIntoView({ block: "nearest" });
      });
    }
  });
</script>

{#if visible}
  <div
    bind:this={ref}
    role="listbox"
    aria-label="Options"
    data-slot="select-content"
    data-state={dataState}
    use:portal={"body"}
    use:floating={{
      anchor: ctx.triggerEl(),
      placement,
      sideOffset,
      anchorWidthVar: "--select-anchor-width",
    }}
    use:dismiss={{
      onDismiss: () => {
        ctx.setOpen(false);
        ctx.triggerEl()?.focus();
      },
      excludeElements: () => [ctx.triggerEl()],
    }}
    {onkeydown}
    tabindex="-1"
    class={cn(
      "relative z-50 max-w-[calc(100vw-1rem)] select-none overflow-hidden rounded-lg border border-border bg-popover bg-clip-padding text-popover-foreground shadow-lg",
      "data-[positioned]:data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[positioned]:data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-97 data-[positioned]:data-[state=open]:zoom-in-98 duration-200 ease-out transition-none",
      className,
    )}
  >
    <!-- Scroll up button -->
    <!-- {#if canScrollUp}
      <button
        type="button"
        tabindex="-1"
        data-slot="select-scroll-up-button"
        onclick={scrollUp}
        class="flex w-full items-center justify-center py-0.5 hover:bg-muted"
        aria-label="Scroll up"
      >
        <Icon icon="chevron_up" size="md" />
      </button>
    {/if} -->

    <!-- Viewport -->
    <div
      bind:this={viewportEl}
      data-slot="select-viewport"
      class="max-h-60 min-w-[var(--select-anchor-width)] overflow-y-auto p-1"
    >
      {@render children?.()}
    </div>

    <!-- Scroll down button -->
    <!-- {#if canScrollDown}
      <button
        type="button"
        tabindex="-1"
        data-slot="select-scroll-down-button"
        onclick={scrollDown}
        class="flex w-full items-center justify-center py-0.5 hover:bg-muted"
        aria-label="Scroll down"
      >
        <Icon icon="chevron_down" size="md" />
      </button>
    {/if} -->
  </div>
{/if}
