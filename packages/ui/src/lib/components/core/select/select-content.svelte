<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    SelectContent,
    SelectPositioner,
    type SelectContentProps,
  } from "@ark-ui/svelte/select";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: SelectContentProps = $props();
</script>

<SelectPositioner>
  <SelectContent
    bind:ref
    data-slot="select-content"
    class={cn(
      "relative z-50 max-h-60 min-w-[var(--reference-width)] max-w-[calc(100vw-1rem)] select-none overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-popover p-1 scroll-py-1 text-popover-foreground shadow-lg outline-none",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-97 data-[state=open]:zoom-in-98 duration-200 ease-out",
      "focus-visible:border-ring focus-visible:ring-[1px]",
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
  </SelectContent>
</SelectPositioner>

<style>
  :global([data-scope="select"][data-part="positioner"]),
  :global([data-scope="select"][data-part="content"]) {
    outline: none !important;
  }
</style>
