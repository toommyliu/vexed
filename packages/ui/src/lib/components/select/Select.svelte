<script lang="ts">
  import { cn } from "$lib/util/cn";
  import { setContext } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { SelectContext } from "./types";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    value?: any;
    onValueChange?: (value: any) => void;
    open?: boolean;
    disabled?: boolean;
    name?: string;
    required?: boolean;
  }

  let {
    value = $bindable(undefined),
    onValueChange = undefined,
    open = $bindable(false),
    disabled = false,
    name = undefined,
    required = false,
    children,
    class: className = undefined,
    ...restProps
  }: Props = $props();

  let anchorWidth = $state(0);
  let items = $state<{ id: string; value: any; disabled: boolean }[]>([]);
  let highlightedIndex = $state(-1);

  const ctx: SelectContext = {
    get value() {
      return value;
    },
    set value(v) {
      value = v;
      if (onValueChange) onValueChange(v);
    },
    get open() {
      return open;
    },
    set open(v) {
      open = v;
      if (!v) highlightedIndex = -1;
    },
    get disabled() {
      return disabled;
    },
    get anchorWidth() {
      return anchorWidth;
    },
    setAnchorWidth(width: number) {
      anchorWidth = width;
    },
    toggle() {
      if (!disabled) open = !open;
    },
    close() {
      open = false;
      highlightedIndex = -1;
    },
    get items() {
      return items;
    },
    get highlightedIndex() {
      return highlightedIndex;
    },
    setHighlightedIndex(index: number) {
      highlightedIndex = index;
    },
    registerItem(id: string, itemValue: any, itemDisabled: boolean) {
      items.push({ id, value: itemValue, disabled: itemDisabled });
    },
    unregisterItem(id: string) {
      const index = items.findIndex((i) => i.id === id);
      if (index !== -1) {
        items.splice(index, 1);
      }
    },
    getItemIndex(id: string) {
      return items.findIndex((i) => i.id === id);
    },
    selectHighlighted() {},
  };

  setContext("select", ctx);
</script>

<div
  class={cn("relative block text-left", className)}
  style="--anchor-width: {anchorWidth}px"
  {...restProps}
>
  {@render children?.()}
  {#if name}
    <input type="hidden" {name} {value} {required} />
  {/if}
</div>
