<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  interface ComboboxListProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
    class?: string;
  }

  let {
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxListProps = $props();
</script>

<div
  data-slot="combobox-list"
  class={cn(
    "max-h-60 min-w-[8rem] w-[var(--combobox-anchor-width)] overflow-y-auto p-1",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
