<script lang="ts">
  import { setContext, type Snippet } from "svelte";
  import { Tooltip } from "@ark-ui/svelte/tooltip";
  import type { PositioningOptions, Placement } from "@zag-js/popper";

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

  let positioning = $state<PositioningOptions>({
    placement: "top",
    offset: { mainAxis: 0, crossAxis: 0 },
  });

  setContext("tooltip", {
    get: () => positioning,
    set: (v: PositioningOptions) => {
      positioning = { ...positioning, ...v };
    },
  });
</script>

<Tooltip.Root bind:open openDelay={delayDuration} {positioning}>
  {@render children?.()}
</Tooltip.Root>
