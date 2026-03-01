<script lang="ts">
  import type { Snippet } from "svelte";
  import { createProviderContext } from "./tooltip-context.js";

  interface TooltipProviderProps {
    /** Delay in ms before any child tooltip opens on hover. @default 700 */
    delayDuration?: number;
    children?: Snippet;
  }

  let { delayDuration = 700, children }: TooltipProviderProps = $props();

  createProviderContext({
    delayDuration: () => delayDuration,
  });
</script>

{@render children?.()}
