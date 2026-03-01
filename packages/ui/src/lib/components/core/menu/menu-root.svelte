<script lang="ts">
  import { createMenuContext } from "./menu-context.js";
  import type { Snippet } from "svelte";

  interface MenuRootProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    children,
  }: MenuRootProps = $props();

  let triggerEl = $state<HTMLElement | null>(null);
  let contentEl = $state<HTMLElement | null>(null);
  let highlightedEl = $state<HTMLElement | null>(null);

  const itemList: Array<{ el: HTMLElement; disabled: boolean }> = [];

  createMenuContext({
    open: () => open,
    setOpen: (v) => {
      open = v;
      if (!v) highlightedEl = null;
      onOpenChange?.(v);
    },
    triggerEl: () => triggerEl,
    setTriggerEl: (el) => {
      triggerEl = el;
    },
    contentEl: () => contentEl,
    setContentEl: (el) => {
      contentEl = el;
    },
    registerItem: (el, disabled) => {
      if (!itemList.find((i) => i.el === el)) {
        itemList.push({ el, disabled });
      }
    },
    unregisterItem: (el) => {
      const idx = itemList.findIndex((i) => i.el === el);
      if (idx !== -1) itemList.splice(idx, 1);
    },
    getItems: () => itemList,
    highlightedEl: () => highlightedEl,
    setHighlightedEl: (el) => {
      highlightedEl = el;
    },
    closeAll: () => {
      open = false;
      highlightedEl = null;
      onOpenChange?.(false);
    },
  });
</script>

<div data-slot="menu">
  {@render children?.()}
</div>
