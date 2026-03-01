<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    getCommandListCtx,
    generateId,
    ATTR_VIEWPORT,
    type CommandViewportProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: CommandViewportProps = $props();

  const list = getCommandListCtx();
  const viewportId = generateId("cmd-viewport");

  $effect(() => {
    list.root.viewportNode = ref;
  });

  $effect(() => {
    const node = ref;
    const listNode = list.listNode;
    if (!node || !listNode) return;

    let aF: number;
    const observer = new ResizeObserver(() => {
      aF = requestAnimationFrame(() => {
        const height = node.offsetHeight;
        listNode.style.setProperty(
          "--bits-command-list-height",
          `${height.toFixed(1)}px`,
        );
      });
    });
    observer.observe(node);

    return () => {
      cancelAnimationFrame(aF);
      observer.unobserve(node);
    };
  });
</script>

<div
  bind:this={ref}
  id={viewportId}
  data-slot="command-viewport"
  {...{ [ATTR_VIEWPORT]: "" }}
  class={cn("p-1.5", className)}
  {...restProps}
>
  {@render children?.()}
</div>
