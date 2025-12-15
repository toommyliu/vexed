<script lang="ts">
    import { getContext, onDestroy, onMount } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import type { MenuContext } from "./types";

    interface Props extends HTMLButtonAttributes {
        disabled?: boolean;
    }

    let {
        class: className = undefined,
        children,
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
    class={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-inherit outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className,
    )}
    {disabled}
    data-disabled={disabled ? "" : undefined}
    data-highlighted={isHighlighted ? "" : undefined}
    onclick={handleClick}
    onmouseenter={handleMouseEnter}
    {...restProps}
>
    {@render children?.()}
</button>
