<script lang="ts">
  import { cn } from "$lib/utils";
  import { getTabsContext } from "./tabs-context.js";
  import type { Snippet } from "svelte";

  type TabsVariant = "default" | "underline";

  interface TabsListProps {
    ref?: HTMLDivElement | null;
    variant?: TabsVariant;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    variant = "default",
    class: className,
    children,
  }: TabsListProps = $props();

  const ctx = getTabsContext();

  let listElement: HTMLDivElement | null = $state(null);
  let indicatorStyle = $state("opacity: 0;");
  let isVertical = $state(false);

  $effect(() => {
    if (ref && listElement === null) {
      listElement = ref;
    }
  });

  $effect(() => {
    if (!listElement) return;

    const updateIndicator = () => {
      if (!listElement) return;

      isVertical = ctx.orientation() === "vertical";
      const activeTab = listElement.querySelector(
        '[data-slot="tabs-trigger"][data-state="active"]',
      );
      if (!activeTab || !(activeTab instanceof HTMLElement)) {
        indicatorStyle = "opacity: 0;";
        return;
      }

      const listRect = listElement.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const top = tabRect.top - listRect.top;
      const left = tabRect.left - listRect.left;
      const width = tabRect.width;
      const height = tabRect.height;
      if (variant === "underline") {
        if (isVertical) {
          indicatorStyle = `top: ${top}px; left: 0; width: 2px; height: ${height}px; opacity: 1;`;
        } else {
          indicatorStyle = `bottom: 0; left: ${left}px; width: ${width}px; height: 2px; opacity: 1;`;
        }
      } else {
        indicatorStyle = `top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px; opacity: 1;`;
      }
    };

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(listElement);
    const mutationObserver = new MutationObserver(updateIndicator);
    mutationObserver.observe(listElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state", "data-orientation"],
    });
    updateIndicator();
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  });
</script>

<div
  bind:this={ref}
  role="tablist"
  data-slot="tabs-list"
  data-variant={variant}
  data-orientation={ctx.orientation()}
  class={cn(
    "relative z-0 flex w-fit gap-x-0.5 text-muted-foreground group/tabs-list",
    "data-[orientation=horizontal]:items-center data-[orientation=horizontal]:justify-center",
    "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:justify-start data-[orientation=vertical]:gap-y-0.5 data-[orientation=vertical]:h-fit",
    variant === "default"
      ? "rounded-lg bg-muted p-0.5 text-muted-foreground/72"
      : "border-muted data-[orientation=horizontal]:border-b data-[orientation=horizontal]:py-1 data-[orientation=vertical]:border-l data-[orientation=vertical]:px-1",
    className,
  )}
>
  {@render children?.()}
  <div
    data-slot="tabs-indicator"
    class={cn(
      "pointer-events-none absolute transition-all duration-200 ease-in-out",
      variant === "underline"
        ? isVertical
          ? "left-0 w-0.5 bg-primary"
          : "bottom-0 h-0.5 bg-primary"
        : "-z-[1] rounded-md bg-background shadow-sm dark:bg-input",
    )}
    style={indicatorStyle}
  ></div>
</div>
