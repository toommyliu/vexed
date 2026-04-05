<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";

  let { class: className, children }: { class?: string; children?: Snippet } =
    $props();
</script>

<div
  class={cn("px-2 py-1 text-xs font-semibold text-muted-foreground", className)}
  data-slot="menu-label"
>
  {@render children?.()}
</div>
