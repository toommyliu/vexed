<script lang="ts">
  import {
    TooltipArrow,
    TooltipArrowTip,
    type TooltipArrowProps,
  } from "@ark-ui/svelte/tooltip";

  let { class: className, children }: TooltipArrowProps = $props();
</script>

<TooltipArrow class={className}>
  {#if children}
    {@render children()}
  {:else}
    <TooltipArrowTip />
  {/if}
</TooltipArrow>
