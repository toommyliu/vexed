<script lang="ts">
  import {
    ComboboxInput,
    ComboboxControl,
    ComboboxTrigger,
    ComboboxClearTrigger,
    type ComboboxInputProps,
  } from "@ark-ui/svelte/combobox";
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";

  let {
    ref = $bindable(null),
    class: className = undefined,
    placeholder,
    showTrigger = true,
    showClear = false,
    onClear,
    ...restProps
  }: ComboboxInputProps & {
    showTrigger?: boolean;
    showClear?: boolean;
    onClear?: () => void;
  } = $props();
</script>

<ComboboxControl class="relative w-full">
  <ComboboxInput
    bind:ref
    data-slot="combobox-input"
    {placeholder}
    class={cn(
      "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none ring-ring/24 transition-shadow",
      "placeholder:text-muted-foreground",
      "focus-visible:border-ring focus-visible:ring-[3px]",
      "disabled:pointer-events-none disabled:opacity-50",
      (showTrigger || showClear) && "pr-8",
      className,
    )}
    {...restProps}
  />
  {#if showClear}
    <ComboboxClearTrigger
      data-slot="combobox-clear"
      onclick={onClear}
      class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground opacity-72 hover:opacity-100 transition-opacity"
      tabindex={-1}
    >
      <Icon icon="x" size="sm" />
    </ComboboxClearTrigger>
  {:else if showTrigger}
    <ComboboxTrigger
      data-slot="combobox-trigger"
      class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground opacity-72 hover:opacity-100 transition-opacity disabled:pointer-events-none"
      tabindex={-1}
    >
      <Icon icon="chevrons_up_down" size="sm" />
    </ComboboxTrigger>
  {/if}
</ComboboxControl>
