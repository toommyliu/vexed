<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getComboboxContext } from "./combobox-context.js";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface ComboboxInputProps extends Omit<HTMLInputAttributes, "children"> {
    ref?: HTMLInputElement | null;
    placeholder?: string;
    showTrigger?: boolean;
    showClear?: boolean;
    onClear?: () => void;
    class?: string;
  }

  let {
    ref = $bindable(null),
    class: className = undefined,
    placeholder,
    showTrigger = true,
    showClear = false,
    onClear,
    onfocus,
    onclick,
    oninput,
    onkeydown,
    ...restProps
  }: ComboboxInputProps = $props();

  const ctx = getComboboxContext();

  $effect(() => {
    ctx.setInputEl(ref);
    return () => ctx.setInputEl(null);
  });

  function handleFocus(e: FocusEvent) {
    // Don't auto-open on focus.
    (onfocus as ((e: FocusEvent) => void) | undefined)?.(e);
  }

  function handleClick(e: MouseEvent) {
    ctx.setOpen(true);
    (onclick as ((e: MouseEvent) => void) | undefined)?.(e);
  }

  function handleInput(e: Event) {
    if (!ctx.open()) {
      ctx.setOpen(true);
    }
    (oninput as ((e: Event) => void) | undefined)?.(e);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!ctx.open()) {
        ctx.setOpen(true);
        return;
      }
      const items = ctx.getItems().filter((i) => !i.disabled);
      if (!items.length) return;
      const cur = ctx.highlightedValue();
      const idx = items.findIndex((i) => i.value === cur);
      if (e.key === "ArrowDown") {
        ctx.setHighlightedValue(items[(idx + 1) % items.length].value);
      } else {
        ctx.setHighlightedValue(
          items[(idx - 1 + items.length) % items.length].value,
        );
      }
    } else if (e.key === "Enter") {
      if (ctx.open()) {
        e.preventDefault();
        const highlighted = ctx.highlightedValue();
        if (highlighted) {
          const item = ctx.getItems().find((i) => i.value === highlighted);
          if (item) ctx.setValue(item.value, item.label);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      ctx.setOpen(false);
    } else if (e.key === "Tab") {
      // Close the popover on Tab
      if (ctx.open()) {
        ctx.setOpen(false);
      }
    } else if (e.key === "Home") {
      if (ctx.open()) {
        e.preventDefault();
        const items = ctx.getItems().filter((i) => !i.disabled);
        if (items.length) ctx.setHighlightedValue(items[0].value);
      }
    } else if (e.key === "End") {
      if (ctx.open()) {
        e.preventDefault();
        const items = ctx.getItems().filter((i) => !i.disabled);
        if (items.length)
          ctx.setHighlightedValue(items[items.length - 1].value);
      }
    }
    (onkeydown as ((e: KeyboardEvent) => void) | undefined)?.(e);
  }
</script>

<div class="relative w-full">
  <input
    bind:this={ref}
    data-slot="combobox-input"
    {placeholder}
    role="combobox"
    aria-expanded={ctx.open()}
    aria-haspopup="listbox"
    autocomplete="off"
    class={cn(
      "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none ring-ring/24 transition-shadow",
      "placeholder:text-muted-foreground",
      "focus-visible:border-ring focus-visible:ring-[3px]",
      "disabled:pointer-events-none disabled:opacity-50",
      (showTrigger || showClear) && "pr-8",
      className,
    )}
    onfocus={handleFocus}
    onclick={handleClick}
    oninput={handleInput}
    onkeydown={handleKeydown}
    {...restProps}
  />
  {#if showClear}
    <button
      type="button"
      data-slot="combobox-clear"
      onclick={onClear}
      class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground opacity-72 hover:opacity-100 transition-opacity"
      tabindex="-1"
      aria-label="Clear"
    >
      <Icon icon="x" size="sm" />
    </button>
  {:else if showTrigger}
    <button
      type="button"
      data-slot="combobox-trigger"
      onclick={() => {
        const wasOpen = ctx.open();
        ctx.setOpen(!wasOpen);
        if (!wasOpen) ref?.focus();
      }}
      class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground opacity-72 hover:opacity-100 transition-opacity disabled:pointer-events-none"
      tabindex={-1}
    >
      <Icon icon="chevrons_up_down" size="sm" />
    </button>
  {/if}
</div>
