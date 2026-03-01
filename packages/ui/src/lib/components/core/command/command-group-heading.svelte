<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    getCommandGroupCtx,
    generateId,
    ATTR_GROUP_HEADING,
    type CommandGroupHeadingProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: CommandGroupHeadingProps = $props();

  const group = getCommandGroupCtx();
  const headingId = generateId("cmd-group-heading");

  $effect(() => {
    if (group) group.headingNode = ref;
  });
</script>

<div
  bind:this={ref}
  id={headingId}
  data-slot="command-group-heading"
  {...{ [ATTR_GROUP_HEADING]: "" }}
  class={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</div>
