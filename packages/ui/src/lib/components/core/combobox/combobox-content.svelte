<script lang="ts">
  import {
    ComboboxPositioner,
    ComboboxContent,
    type ComboboxContentProps,
  } from "@ark-ui/svelte/combobox";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxContentProps = $props();
</script>

<ComboboxPositioner class="z-50">
  <ComboboxContent
    bind:ref
    data-slot="combobox-content"
    class={cn(
      "relative z-50 min-w-[var(--combobox-anchor-width)] max-w-[calc(100vw-1rem)] select-none overflow-hidden rounded-lg border bg-popover bg-clip-padding text-popover-foreground",
      "shadow-[0_4px_12px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)] before:shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:before:shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-97 data-[state=open]:zoom-in-98 duration-200 ease-out",
      "focus-visible:ring focus-visible:ring-ring",
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
  </ComboboxContent>
</ComboboxPositioner>
