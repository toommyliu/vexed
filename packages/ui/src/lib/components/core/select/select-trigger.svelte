<script lang="ts">
  import { cn, type WithoutChild } from "$lib/utils";
  import { Icon } from "$lib";
  import {
    SelectTrigger,
    SelectIndicator,
    type SelectTriggerProps,
  } from "@ark-ui/svelte/select";

  let {
    ref = $bindable(null),
    class: className = undefined,
    size = "default",
    disabled = false,
    children,
    ...restProps
  }: WithoutChild<SelectTriggerProps> & {
    size?: "sm" | "default" | "lg";
  } = $props();
</script>

<SelectTrigger
  bind:ref
  data-slot="select-trigger"
  class={cn(
    "relative flex items-center justify-between select-none rounded-lg border border-input bg-background bg-clip-padding text-base/5 shadow-sm outline-none ring-ring/24 transition-shadow",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
    "focus-visible:border-ring focus-visible:ring-[3px]",
    "disabled:pointer-events-none disabled:opacity-50",
    "sm:text-sm dark:bg-input/32 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-72",
    size === "sm" && "gap-1.5 px-2 py-1 text-sm",
    size === "default" && "gap-2 px-3 py-1.5",
    size === "lg" && "gap-2 px-3 py-2",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
  <SelectIndicator data-slot="select-icon" class="-me-1 opacity-72">
    <Icon icon="chevrons_up_down" size="md" />
  </SelectIndicator>
</SelectTrigger>
