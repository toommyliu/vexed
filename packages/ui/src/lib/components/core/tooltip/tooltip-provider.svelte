<script lang="ts">
  import type { Snippet } from "svelte";
  import { createProviderContext } from "./tooltip-context.js";

  interface TooltipProviderProps {
    delayDuration?: number;
    children?: Snippet;
  }

  let { delayDuration = 700, children }: TooltipProviderProps = $props();

  createProviderContext({
    delayDuration: () => delayDuration,
  });
</script>

{@render children?.()}
