<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getComboboxContext } from "./combobox-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface ComboboxTriggerProps extends HTMLButtonAttributes {
    ref?: HTMLButtonElement | null;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxTriggerProps = $props();

  const ctx = getComboboxContext();

  $effect(() => {
    ctx.setTriggerEl(ref);
    return () => ctx.setTriggerEl(null);
  });
</script>

<button
  bind:this={ref}
  type="button"
  data-slot="combobox-trigger"
  aria-expanded={ctx.open()}
  aria-haspopup="listbox"
  onclick={() => {
    const wasOpen = ctx.open();
    ctx.setOpen(!wasOpen);
    if (!wasOpen) ctx.inputEl()?.focus();
  }}
  class={cn(
    "relative flex items-center justify-between select-none rounded-lg border border-input bg-background bg-clip-padding px-3 py-1.5 text-sm shadow-sm outline-none ring-ring/24 transition-shadow",
    "focus-visible:border-ring focus-visible:ring-[3px]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-72",
    className,
  )}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
  <Icon icon="chevrons_up_down" size="md" />
</button>
