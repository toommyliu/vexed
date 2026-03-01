<script lang="ts">
  import { cn } from "$lib/utils";
  import { tv, type VariantProps } from "tailwind-variants";
  import { getMenuContext } from "./menu-context.js";
  import { onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  const itemVariants = tv({
    base: [
      "relative flex w-full cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[highlighted]:bg-muted",
      "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    ],
    variants: {
      variant: {
        default: "text-foreground",
        destructive: "text-destructive data-[highlighted]:bg-destructive/10",
      },
    },
    defaultVariants: { variant: "default" },
  });

  type ItemVariant = VariantProps<typeof itemVariants>["variant"];

  interface MenuItemProps extends Omit<HTMLButtonAttributes, "children"> {
    ref?: HTMLButtonElement | null;
    variant?: ItemVariant;
    disabled?: boolean;
    closeOnSelect?: boolean;
    onSelect?: () => void;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    variant = "default",
    disabled = false,
    closeOnSelect = true,
    onSelect,
    children,
    ...restProps
  }: MenuItemProps = $props();

  const ctx = getMenuContext();

  const isHighlighted = $derived(ctx.highlightedEl() === ref);

  $effect(() => {
    if (ref) ctx.registerItem(ref, disabled);
    return () => {
      if (ref) ctx.unregisterItem(ref);
    };
  });
  onDestroy(() => {
    if (ref) ctx.unregisterItem(ref);
  });
</script>

<button
  bind:this={ref}
  type="button"
  role="menuitem"
  data-slot="menu-item"
  data-variant={variant}
  data-highlighted={isHighlighted ? "" : undefined}
  data-disabled={disabled ? "" : undefined}
  {disabled}
  tabindex="-1"
  onpointerenter={() => {
    if (!disabled && ref) ctx.setHighlightedEl(ref);
  }}
  onpointerleave={() => {
    if (ctx.highlightedEl() === ref) ctx.setHighlightedEl(null);
  }}
  onclick={() => {
    if (disabled) return;
    onSelect?.();
    if (closeOnSelect) ctx.closeAll();
  }}
  class={cn(itemVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</button>
