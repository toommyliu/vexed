<script lang="ts">
  import { type Snippet } from "svelte";
  import { setTooltipContext, TooltipState } from "./tooltip-context.svelte";

  interface TooltipRootProps {
    open?: boolean;
    delayDuration?: number;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    delayDuration = 0,
    children,
  }: TooltipRootProps = $props();

  const state = new TooltipState({});
  
  $effect(() => {
    state.openDelay = delayDuration;
  });

  $effect(() => {
    open = state.open;
  });
  
  $effect(() => {
    state.open = open;
  });

  setTooltipContext(state);
</script>

{@render children?.()}
