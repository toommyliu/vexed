<script lang="ts">
  import { getContext } from "svelte";
  import { cn } from "$lib/util/cn";
  import type { HTMLAttributes } from "svelte/elements";
  import type { TabsContext } from "./types";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    value: string;
  }

  let {
    value,
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();

  const ctx = getContext<TabsContext>("tabs");
</script>

{#if ctx.value === value}
  <div
    role="tabpanel"
    class={cn(
      "mt-2 flex-1 text-sm outline-none group-data-[orientation=vertical]/tabs:mt-0",
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
  </div>
{/if}
