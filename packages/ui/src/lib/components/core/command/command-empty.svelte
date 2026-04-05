<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    getCommandRootCtx,
    generateId,
    ATTR_EMPTY,
    type CommandEmptyProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    forceMount = false,
    children,
    ...restProps
  }: CommandEmptyProps = $props();

  const root = getCommandRootCtx();
  const emptyId = generateId("cmd-empty");

  let isInitialRender = $state(true);
  $effect.pre(() => {
    isInitialRender = false;
  });

  let shouldRender = $derived(
    (root.commandState.filtered.count === 0 && !isInitialRender) || forceMount,
  );
</script>

{#if shouldRender}
  <div
    bind:this={ref}
    id={emptyId}
    data-slot="command-empty"
    {...{ [ATTR_EMPTY]: "" }}
    role="presentation"
    class={cn("py-12 text-center text-sm text-muted-foreground", className)}
    {...restProps}
  >
    {@render children?.()}
  </div>
{/if}
