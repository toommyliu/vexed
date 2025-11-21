<script lang="ts">
    import { getContext, onDestroy, onMount } from "svelte";
    import { cn } from "$lib/util/cn";
    import { Check } from "lucide-svelte";
    import type { HTMLAttributes } from "svelte/elements";
    import type { ComboboxContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        value: any;
        label?: string;
        disabled?: boolean;
    }

    let {
        value,
        label = undefined,
        disabled = false,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<ComboboxContext>("combobox");
    const id = Math.random().toString(36).substring(2, 15);

    onMount(() => {
        ctx.registerItem(id, value);
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
        ctx.setValue(value);
        ctx.setInputValue(label || String(value)); // Optional: update input value on select
        ctx.close();
    }

    function handleMouseEnter() {
        if (disabled) return;
        const index = ctx.getItemIndex(id);
        if (index !== -1) {
            ctx.setHighlightedIndex(index);
        }
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50",
        className,
    )}
    data-slot="combobox-item"
    data-highlighted={isHighlighted ? "" : undefined}
    data-disabled={disabled ? "" : undefined}
    onclick={handleSelect}
    onmouseenter={handleMouseEnter}
    {...restProps}
>
    <span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        {#if isSelected}
            <Check class="h-4 w-4" />
        {/if}
    </span>
    {@render children?.()}
</div>
