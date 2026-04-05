<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    getCommandRootCtx,
    generateId,
    ATTR_SEPARATOR,
    type CommandSeparatorProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    forceMount = false,
    ...restProps
  }: CommandSeparatorProps = $props();

  const root = getCommandRootCtx();
  const sepId = generateId("cmd-separator");

  let shouldRender = $derived(!root.commandState.search || forceMount);
</script>

{#if shouldRender}
  <hr
    bind:this={ref}
    id={sepId}
    data-slot="command-separator"
    {...{ [ATTR_SEPARATOR]: "" }}
    aria-hidden="true"
    class={cn("-mx-1 my-1 h-px border-0 bg-border", className)}
    {...restProps}
  />
{/if}
