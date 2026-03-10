<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  interface ComboboxSeparatorProps extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  let { class: className = undefined, ...restProps }: ComboboxSeparatorProps =
    $props();
</script>

<div
  data-slot="combobox-separator"
  class={cn("mx-2 my-1 h-px bg-border", className)}
  {...restProps}
></div>
