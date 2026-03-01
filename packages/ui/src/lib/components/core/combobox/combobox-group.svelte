<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface ComboboxGroupProps extends HTMLAttributes<HTMLDivElement> {
    class?: string;
    children?: Snippet;
  }

  let {
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxGroupProps = $props();
</script>

<div
  role="group"
  data-slot="combobox-group"
  class={cn("overflow-hidden text-foreground [[role=group]+&]:mt-1.5", className)}
  {...restProps}
>
  {@render children?.()}
</div>
