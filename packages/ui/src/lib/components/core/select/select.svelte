<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    createSelectContext,
    type SelectItemEntry,
  } from "./select-context.js";
  import type { Snippet } from "svelte";

  interface SelectRootProps {
    value?: string;
    open?: boolean;
    disabled?: boolean;
    name?: string;
    required?: boolean;
    class?: string;
    onValueChange?: (value: string) => void;
    children?: Snippet;
  }

  let {
    value = $bindable(""),
    open = $bindable(false),
    disabled = false,
    name,
    required = false,
    class: className,
    onValueChange,
    children,
  }: SelectRootProps = $props();

  const itemMap = new Map<string, SelectItemEntry>();
  let triggerEl = $state<HTMLElement | null>(null);
  let highlightedValue = $state<string | null>(null);
  let selectedLabel = $state("");

  createSelectContext({
    value: () => value,
    open: () => open,
    disabled: () => disabled,
    setValue: (v: string, label: string) => {
      value = v;
      selectedLabel = label;
      open = false;
      onValueChange?.(v);
    },
    setOpen: (v: boolean) => {
      if (disabled) return;
      open = v;
      if (!v) highlightedValue = null;
    },
    triggerEl: () => triggerEl,
    setTriggerEl: (el) => {
      triggerEl = el;
    },
    registerItem: (v, label, dis) => {
      itemMap.set(v, { value: v, label, disabled: dis });
      if (v === value) selectedLabel = label;
    },
    unregisterItem: (v) => {
      itemMap.delete(v);
    },
    getItems: () => Array.from(itemMap.values()),
    highlightedValue: () => highlightedValue,
    setHighlightedValue: (v) => {
      highlightedValue = v;
    },
    selectedLabel: () => selectedLabel,
  });
</script>

<div
  data-slot="select"
  data-disabled={disabled ? "" : undefined}
  class={cn("relative block text-left", className)}
>
  {@render children?.()}
</div>
