<script lang="ts">
  import {
    ComboboxTrigger,
    type ComboboxTriggerProps,
  } from "@ark-ui/svelte/combobox";
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxTriggerProps = $props();
</script>

<ComboboxTrigger
  bind:ref
  data-slot="combobox-trigger"
  class={cn(
    "relative flex items-center justify-between select-none rounded-lg border border-input bg-background bg-clip-padding px-3 py-1.5 text-sm shadow-sm outline-none ring-ring/24 transition-shadow",
    "focus-visible:border-ring focus-visible:ring-[3px]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-72",
    className,
  )}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
  <Icon icon="chevrons_up_down" size="md" />
</ComboboxTrigger>
