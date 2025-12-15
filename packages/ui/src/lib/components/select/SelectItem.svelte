<script lang="ts">
    import { getContext, onDestroy, onMount } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { SelectContext } from "./types";

    interface Props extends HTMLAttributes<HTMLButtonElement> {
        value: any;
        disabled?: boolean;
    }

    let {
        value,
        disabled = false,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<SelectContext>("select");
    const id = Math.random().toString(36).substring(2, 15);

    onMount(() => {
        ctx.registerItem(id, value, disabled);
    });

    onDestroy(() => {
        ctx.unregisterItem(id);
    });

    let isSelected = $derived(ctx.value === value);
    let isHighlighted = $derived(
        ctx.highlightedIndex >= 0 && ctx.items[ctx.highlightedIndex]?.id === id,
    );

    function handleSelect() {
        if (disabled) return;
        ctx.value = value;
        ctx.close();
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
                    ctx.value = value;
                    ctx.close();
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
    role="option"
    aria-selected={isSelected}
    {disabled}
    onclick={handleSelect}
    onmouseenter={handleMouseEnter}
    class={cn(
        "relative w-full flex cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 px-2 text-sm outline-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        "[&[data-disabled]]:cursor-not-allowed [&[data-disabled]]:opacity-50 [&[data-disabled]]:pointer-events-none [&[data-disabled]:hover]:bg-transparent",
        className,
    )}
    data-slot="select-item"
    data-disabled={disabled ? "" : undefined}
    data-highlighted={isHighlighted ? "" : undefined}
    {...restProps}
>
    <span class="flex-1 min-w-0 text-start">
        {@render children?.()}
    </span>
    {#if isSelected}
        <svg
            fill="none"
            height="24"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="24"
            class="size-4 text-primary shrink-0"
        >
            <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
    {/if}
</button>
