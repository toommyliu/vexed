<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    CommandListState,
    getCommandRootCtx,
    setCommandListCtx,
    generateId,
    ATTR_LIST,
    type CommandListProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    ariaLabel = "Suggestions",
    children,
    ...restProps
  }: CommandListProps = $props();

  const root = getCommandRootCtx();
  const listState = new CommandListState(root);
  setCommandListCtx(listState);

  const listId = listState.id;

  $effect(() => {
    listState.listNode = ref;
  });
</script>

<div
  bind:this={ref}
  id={listId}
  data-slot="command-list"
  {...{ [ATTR_LIST]: "" }}
  role="listbox"
  aria-label={ariaLabel}
  class={cn(
    "max-h-[280px] overflow-x-hidden overflow-y-auto scroll-py-1.5 outline-none",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
