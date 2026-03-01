<script lang="ts">
  import { cn } from "$lib/utils";
  import { createTabsContext } from "./tabs-context.js";
  import type { Snippet } from "svelte";

  interface TabsProps {
    ref?: HTMLDivElement | null;
    value?: string;
    orientation?: "horizontal" | "vertical";
    class?: string;
    children?: Snippet;
    onValueChange?: (value: string) => void;
  }

  let {
    ref = $bindable(null),
    value = $bindable(""),
    orientation = "horizontal",
    class: className,
    children,
    onValueChange,
  }: TabsProps = $props();

  const triggers = new Map<string, HTMLElement>();

  createTabsContext({
    value: () => value,
    setValue: (v: string) => {
      value = v;
      onValueChange?.(v);
    },
    orientation: () => orientation,
    registerTrigger: (v, el) => triggers.set(v, el),
    unregisterTrigger: (v) => triggers.delete(v),
  });
</script>

<div
  bind:this={ref}
  data-slot="tabs"
  data-orientation={orientation}
  class={cn(
    "flex gap-2 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex-row data-[orientation=vertical]:items-start",
    className,
  )}
>
  {@render children?.()}
</div>
