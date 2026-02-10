<script lang="ts">
  import { getContext } from "svelte";
  import { cn } from "$lib/util/cn";
  import type { HTMLAttributes } from "svelte/elements";
  import type { TabsContext } from "./types";

  interface Props extends HTMLAttributes<HTMLDivElement> {}

  let {
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();

  const ctx = getContext<TabsContext>("tabs");

  function getNextEnabledIndex(
    currentIndex: number,
    direction: 1 | -1,
  ): number {
    if (ctx.tabs.length === 0) return -1;
    let index = currentIndex;
    for (let i = 0; i < ctx.tabs.length; i++) {
      index = (index + direction + ctx.tabs.length) % ctx.tabs.length;
      if (!ctx.tabs[index].disabled) return index;
    }
    return -1;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const currentIndex = ctx.tabs.findIndex((t) => t.value === ctx.value);
      const direction = e.key === "ArrowRight" ? 1 : -1;
      const nextIndex = getNextEnabledIndex(currentIndex, direction);
      if (nextIndex !== -1) {
        ctx.value = ctx.tabs[nextIndex].value;
        ctx.focusTab(ctx.tabs[nextIndex].value);
      }
    }
  }
</script>

<div
  role="tablist"
  class={cn(
    "inline-flex h-8 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:w-auto group-data-[orientation=vertical]/tabs:flex-col",
    className,
  )}
  onkeydown={handleKeyDown}
  {...restProps}
>
  {@render children?.()}
</div>
