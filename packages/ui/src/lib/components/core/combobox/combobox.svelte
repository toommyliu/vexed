<script lang="ts">
  import {
    createComboboxContext,
    type ComboboxItemEntry,
  } from "./combobox-context.js";
  import type { Snippet } from "svelte";

  interface ComboboxRootProps {
    value?: string;
    open?: boolean;
    disabled?: boolean;
    name?: string;
    required?: boolean;
    onValueChange?: (value: string) => void;
    onOpenChange?: (open: boolean) => void;
    children?: Snippet;
  }

  let {
    value = $bindable(""),
    open = $bindable(false),
    disabled = false,
    name,
    required = false,
    onValueChange,
    onOpenChange,
    children,
  }: ComboboxRootProps = $props();

  const itemMap = new Map<string, ComboboxItemEntry>();
  let inputEl = $state<HTMLInputElement | null>(null);
  let triggerEl = $state<HTMLElement | null>(null);
  let highlightedValue = $state<string | null>(null);

  createComboboxContext({
    value: () => value,
    open: () => open,
    disabled: () => disabled,
    setValue: (v: string, _label: string) => {
      value = v;
      open = false;
      onValueChange?.(v);
      onOpenChange?.(false);
      // Return focus to input after selection
      inputEl?.focus();
    },
    setOpen: (v: boolean) => {
      if (disabled) return;
      if (open === v) return;
      open = v;
      if (!v) highlightedValue = null;
      onOpenChange?.(v);
    },
    inputEl: () => inputEl,
    setInputEl: (el) => {
      inputEl = el;
    },
    triggerEl: () => triggerEl,
    setTriggerEl: (el) => {
      triggerEl = el;
    },
    registerItem: (v, label, dis) => {
      itemMap.set(v, { value: v, label, disabled: dis });
    },
    unregisterItem: (v) => {
      itemMap.delete(v);
    },
    getItems: () => Array.from(itemMap.values()),
    highlightedValue: () => highlightedValue,
    setHighlightedValue: (v) => {
      highlightedValue = v;
    },
  });
</script>

<div data-slot="combobox" data-disabled={disabled ? "" : undefined}>
  {@render children?.()}
</div>
