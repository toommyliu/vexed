<script lang="ts">
  import { TabTrigger, type TabTriggerProps } from "@ark-ui/svelte/tabs";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    value,
    disabled = false,
    class: className,
    children,
    ...restProps
  }: TabTriggerProps = $props();
</script>

<TabTrigger
  bind:ref
  {value}
  {disabled}
  data-slot="tabs-trigger"
  class={cn(
    "relative z-10 flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2.5 font-medium text-sm outline-none transition-[color,background-color,box-shadow] select-none",
    "hover:text-foreground/60 group-data-[variant=underline]/tabs-list:hover:bg-accent/40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-64",
    "data-[state=active]:text-foreground data-[selected]:text-foreground",
    "data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start",
    "[&_svg:not([class*='size-'])]:size-4",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</TabTrigger>
