<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface ComboboxGroupLabelProps extends HTMLAttributes<HTMLDivElement> {
    class?: string;
    children?: Snippet;
  }

  let {
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxGroupLabelProps = $props();
</script>

<div
  data-slot="combobox-group-label"
  class={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</div>
