<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    getCommandGroupCtx,
    generateId,
    ATTR_GROUP_ITEMS,
    type CommandGroupItemsProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: CommandGroupItemsProps = $props();

  const group = getCommandGroupCtx();
  const itemsId = generateId("cmd-group-items");

  let headingId = $derived(group?.headingNode?.id ?? undefined);
</script>

<div
  bind:this={ref}
  id={itemsId}
  data-slot="command-group-items"
  {...{ [ATTR_GROUP_ITEMS]: "" }}
  role="group"
  aria-labelledby={headingId}
  class={cn(className)}
  {...restProps}
>
  {@render children?.()}
</div>
