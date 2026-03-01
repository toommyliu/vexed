<script lang="ts">
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";
  import {
    CommandGroupState,
    getCommandRootCtx,
    setCommandGroupCtx,
    ATTR_GROUP,
    COMMAND_VALUE_ATTR,
    type CommandGroupProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    value,
    forceMount = false,
    children,
    ...restProps
  }: CommandGroupProps = $props();

  const root = getCommandRootCtx();
  const groupOpts = {
    get value() {
      return value;
    },
    get forceMount() {
      return forceMount;
    },
  };
  const group = new CommandGroupState(root, groupOpts);
  setCommandGroupCtx(group);

  $effect(() => {
    return root.registerGroup(group.trueValue);
  });

  $effect(() => {
    if (value) {
      group.trueValue = value;
      return root.registerValue(value);
    } else if (group.headingNode?.textContent) {
      group.trueValue = group.headingNode.textContent.trim().toLowerCase();
      return root.registerValue(group.trueValue);
    } else {
      group.trueValue = `-----${group.id}`;
      return root.registerValue(group.trueValue);
    }
  });
</script>

<div
  bind:this={ref}
  id={group.id}
  data-slot="command-group"
  {...{ [ATTR_GROUP]: "" }}
  role="presentation"
  hidden={group.shouldRender ? undefined : true}
  data-value={group.trueValue}
  class={cn("overflow-hidden text-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</div>
