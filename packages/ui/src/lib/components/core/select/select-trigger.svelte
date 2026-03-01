<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getSelectContext } from "./select-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface SelectTriggerProps extends Omit<HTMLButtonAttributes, "disabled"> {
    ref?: HTMLButtonElement | null;
    size?: "sm" | "default" | "lg";
    disabled?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className = undefined,
    size = "default",
    disabled = false,
    children,
    ...restProps
  }: SelectTriggerProps = $props();

  const ctx = getSelectContext();
  const isDisabled = $derived(disabled || ctx.disabled());
  const dataState = $derived(ctx.open() ? "open" : "closed");

  $effect(() => {
    if (ref) ctx.setTriggerEl(ref);
    return () => ctx.setTriggerEl(null);
  });
</script>

<button
  bind:this={ref}
  type="button"
  role="combobox"
  aria-haspopup="listbox"
  aria-expanded={ctx.open()}
  data-slot="select-trigger"
  data-state={dataState}
  disabled={isDisabled}
  onclick={() => ctx.setOpen(!ctx.open())}
  {...restProps}
  class={cn(
    "relative flex items-center justify-between select-none rounded-lg border border-input bg-background bg-clip-padding text-base/5 shadow-sm outline-none ring-ring/24 transition-shadow",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)]",
    "focus-visible:border-ring focus-visible:ring-[3px]",
    "disabled:pointer-events-none disabled:opacity-50",
    "sm:text-sm dark:bg-input/32 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-72",
    size === "sm" && "gap-1.5 px-2 py-1 text-sm",
    size === "default" && "gap-2 px-3 py-1.5",
    size === "lg" && "gap-2 px-3 py-2",
    className,
  )}
>
  {@render children?.()}
  <span data-slot="select-icon" class="-me-1 opacity-72">
    <Icon icon="chevrons_up_down" size="md" />
  </span>
</button>
