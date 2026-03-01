<script lang="ts">
  import { cn } from "$lib/utils";
  import { getTabsContext } from "./tabs-context.js";
  import type { Snippet } from "svelte";

  interface TabsContentProps {
    ref?: HTMLDivElement | null;
    value: string;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    value,
    class: className,
    children,
  }: TabsContentProps = $props();

  const ctx = getTabsContext();
  const isActive = $derived(ctx.value() === value);
</script>

{#if isActive}
  <div
    bind:this={ref}
    role="tabpanel"
    data-slot="tabs-content"
    data-state="active"
    class={cn("flex-1 outline-none", className)}
  >
    {@render children?.()}
  </div>
{/if}
