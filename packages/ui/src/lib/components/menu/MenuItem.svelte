<script lang="ts">
  import { getContext, onDestroy, onMount } from "svelte";
  import { cn } from "$lib/util/cn";
  import { tv, type VariantProps } from "tailwind-variants";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { MenuContext } from "./types";

  const itemVariants = tv({
    base: [
      "relative flex w-full cursor-default select-none items-center rounded-[6px] px-2 py-1 text-sm outline-none transition-colors",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    ],
    variants: {
      variant: {
        default: [
          "text-foreground",
          "data-[highlighted]:bg-accent/80 data-[highlighted]:text-accent-foreground",
          "hover:bg-accent/80 hover:text-accent-foreground focus:bg-accent/80 focus:text-accent-foreground",
        ],
        destructive: [
          "text-destructive",
          "data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive",
          "hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  type ItemVariant = VariantProps<typeof itemVariants>["variant"];

  interface Props extends HTMLButtonAttributes {
    variant?: ItemVariant;
    disabled?: boolean;
  }

  let {
    class: className = undefined,
    children,
    variant = "default",
    disabled = false,
    ...restProps
  }: Props = $props();

  const ctx = getContext<MenuContext>("menu");
  const id = Math.random().toString(36).substring(2, 15);

  onMount(() => {
    ctx.registerItem(id, disabled);
  });

  onDestroy(() => {
    ctx.unregisterItem(id);
  });

  let isHighlighted = $derived(
    ctx.highlightedIndex >= 0 && ctx.items[ctx.highlightedIndex]?.id === id,
  );

  function handleClick(e: MouseEvent) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    ctx.close();
    // @ts-ignore - event type mismatch
    restProps.onclick?.(e);
  }

  function handleMouseEnter() {
    if (disabled) return;
    const index = ctx.getItemIndex(id);
    if (index !== -1) {
      ctx.setHighlightedIndex(index);
    }
  }

  $effect(() => {
    if (isHighlighted) {
      const originalSelect = ctx.selectHighlighted;
      ctx.selectHighlighted = () => {
        if (!disabled) {
          ctx.close();
          // @ts-ignore
          restProps.onclick?.({} as MouseEvent);
        }
      };
      return () => {
        ctx.selectHighlighted = originalSelect;
      };
    }
  });
</script>

<button
  type="button"
  role="menuitem"
  class={cn(itemVariants({ variant }), className)}
  {disabled}
  data-disabled={disabled ? "" : undefined}
  data-highlighted={isHighlighted ? "" : undefined}
  onclick={handleClick}
  onmouseenter={handleMouseEnter}
  {...restProps}
>
  {@render children?.()}
</button>
