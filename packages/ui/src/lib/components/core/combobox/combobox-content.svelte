<script lang="ts">
  import { cn } from "$lib/utils";
  import { getComboboxContext } from "./combobox-context.js";
  import { portal } from "$lib/actions/portal.js";
  import { floating } from "$lib/actions/floating.js";
  import { dismiss } from "$lib/actions/dismiss.js";
  import { tick, type Snippet } from "svelte";

  interface ComboboxContentProps {
    ref?: HTMLDivElement | null;
    class?: string;
    sideOffset?: number;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className = undefined,
    sideOffset = 4,
    children,
  }: ComboboxContentProps = $props();

  const ctx = getComboboxContext();

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

  // When opened, highlight first non-disabled item
  $effect(() => {
    if (open) {
      const items = ctx.getItems().filter((i) => !i.disabled);
      const cur = ctx.value();
      const match = items.find((i) => i.value === cur);
      ctx.setHighlightedValue(match?.value ?? items[0]?.value ?? null);
    }
  });

  // Scroll highlighted item into view when navigating with keyboard
  $effect(() => {
    const hv = ctx.highlightedValue();
    if (hv && ref) {
      tick().then(() => {
        const el = ref?.querySelector("[data-highlighted]");
        el?.scrollIntoView({ block: "nearest" });
      });
    }
  });

  // Anchor: prefer input, fall back to trigger
  const anchorEl = $derived<HTMLElement | null>(
    ctx.inputEl() ?? ctx.triggerEl(),
  );
</script>

{#if visible}
  <div
    bind:this={ref}
    role="listbox"
    aria-label="Options"
    data-slot="combobox-content"
    data-state={dataState}
    use:portal={"body"}
    use:floating={{
      anchor: anchorEl,
      placement: "bottom-start",
      sideOffset,
      anchorWidthVar: "--combobox-anchor-width",
    }}
    use:dismiss={{
      onDismiss: () => ctx.setOpen(false),
      excludeElements: () => [ctx.triggerEl(), ctx.inputEl()?.parentElement ?? null],
    }}
    class={cn(
      "relative z-50 min-w-[var(--combobox-anchor-width)] max-w-[calc(100vw-1rem)] select-none overflow-hidden rounded-lg border bg-popover bg-clip-padding text-popover-foreground",
      "shadow-[0_4px_12px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)] before:shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:before:shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]",
      "data-[positioned]:data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[positioned]:data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-97 data-[positioned]:data-[state=open]:zoom-in-98 duration-200 ease-out transition-none",
      className,
    )}
  >
    {@render children?.()}
  </div>
{/if}
