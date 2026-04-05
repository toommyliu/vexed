<script lang="ts">
  import {
    TabIndicator,
    TabList,
    type TabListProps,
  } from "@ark-ui/svelte/tabs";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  type TabsVariant = "default" | "underline";

  let {
    ref = $bindable(null),
    variant = "default",
    class: className,
    children,
    ...restProps
  }: TabListProps & {
    variant?: TabsVariant;
  } = $props();
</script>

<TabList
  bind:ref
  data-slot="tabs-list"
  data-variant={variant}
  class={cn(
    "relative z-0 flex w-fit gap-x-0.5 text-muted-foreground group/tabs-list",
    "data-[orientation=horizontal]:items-center data-[orientation=horizontal]:justify-center",
    "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:justify-start data-[orientation=vertical]:gap-y-0.5 data-[orientation=vertical]:h-fit",
    variant === "default"
      ? "rounded-lg bg-muted p-0.5 text-muted-foreground/72"
      : "border-muted data-[orientation=horizontal]:border-b data-[orientation=horizontal]:py-1 data-[orientation=vertical]:border-l data-[orientation=vertical]:px-1",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
  <TabIndicator
    data-slot="tabs-indicator"
    class={cn(
      "pointer-events-none absolute transition-all duration-200 ease-in-out",
      "w-[var(--width)] h-[var(--height)] top-[var(--top)] left-[var(--left)]",
      variant === "underline"
        ? [
            "bg-primary",
            "group-data-[orientation=horizontal]/tabs-list:!h-0.5 group-data-[orientation=horizontal]/tabs-list:top-auto group-data-[orientation=horizontal]/tabs-list:bottom-0",
            "group-data-[orientation=vertical]/tabs-list:!w-0.5 group-data-[orientation=vertical]/tabs-list:left-0",
          ]
        : "-z-[1] rounded-md bg-background shadow-sm dark:bg-input",
    )}
  />
</TabList>
