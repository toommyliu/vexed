<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    getCommandRootCtx,
    getCommandGroupCtx,
    generateId,
    boolToStr,
    boolToEmptyStrOrUndef,
    ATTR_ITEM,
    COMMAND_VALUE_ATTR,
    type CommandLinkItemProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    value,
    keywords = [],
    disabled = false,
    forceMount = false,
    onSelect,
    children,
    ...restProps
  }: CommandLinkItemProps = $props();

  const root = getCommandRootCtx();
  const group = getCommandGroupCtx();
  const itemId = generateId("cmd-link-item");

  let trueValue = $state("");

  $effect(() => {
    if (value) {
      trueValue = value;
    } else if (ref?.textContent) {
      trueValue = ref.textContent.trim();
    }
    if (trueValue) {
      const kws = (keywords ?? []).map((kw: string) => kw.trim());
      root.registerValue(trueValue, kws);
      ref?.setAttribute(COMMAND_VALUE_ATTR, trueValue);
    }
  });

  $effect(() => {
    if (forceMount || !trueValue) return;
    return root.registerItem(trueValue, group?.trueValue);
  });

  let isSelected = $derived(
    root.commandState.value === trueValue && trueValue !== "",
  );
  let shouldRender = $derived.by(() => {
    if (forceMount || root.shouldFilter === false || !root.commandState.search)
      return true;
    const score = root.commandState.filtered.items.get(trueValue);
    return score !== undefined && score > 0;
  });

  function onclick() {
    if (disabled) return;
    root.setValue(trueValue, true);
    onSelect?.();
  }

  function onpointermove() {
    if (disabled || root.disablePointerSelection) return;
    root.setValue(trueValue, true);
  }
</script>

<div style="display:contents" data-item-wrapper data-value={trueValue}>
  {#if shouldRender}
    <a
      bind:this={ref}
      id={itemId}
      data-slot="command-link-item"
      {...{ [ATTR_ITEM]: "" }}
      role="option"
      aria-disabled={boolToStr(disabled)}
      aria-selected={boolToStr(isSelected)}
      data-disabled={boolToEmptyStrOrUndef(disabled)}
      data-selected={boolToEmptyStrOrUndef(isSelected)}
      data-value={trueValue}
      data-group={group?.trueValue}
      {onclick}
      {onpointermove}
      class={cn(
        "relative flex h-9 w-full cursor-default select-none items-center gap-2.5 rounded-md px-3 text-sm outline-none",
        "data-[selected]:bg-accent data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...restProps}
    >
      {@render children?.()}
    </a>
  {/if}
</div>
