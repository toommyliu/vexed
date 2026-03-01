<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  interface ComboboxEmptyProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
    class?: string;
  }

  let {
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxEmptyProps = $props();
</script>

<div
  data-slot="combobox-empty"
  class={cn("py-6 text-center text-sm text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</div>
