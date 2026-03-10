<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<!--
  Migration notes:
  - In the original implementation, TooltipPortal was already a thin passthrough
    wrapper whose main purpose was to signal "render content outside the DOM tree".
  - Ark UI's Tooltip.Positioner already portals the tooltip to <body> automatically,
    so this component remains a transparent passthrough for backward compatibility.
  - Existing usage of <TooltipPortal> / <Portal> in consumer code requires zero changes.
-->
{@render children?.()}
