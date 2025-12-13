<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLInputAttributes } from "svelte/elements";
    import type { ComboboxContext } from "./types";

    interface Props extends HTMLInputAttributes {
        showTrigger?: boolean;
        showClear?: boolean;
    }

    let {
        class: className = undefined,
        showTrigger = true,
        showClear = false,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<ComboboxContext>("combobox");

    function handleKeyDown(e: KeyboardEvent) {
        if (ctx.disabled) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!ctx.open) {
                ctx.setOpen(true);
            }
            ctx.setHighlightedIndex(
                (ctx.highlightedIndex + 1) % ctx.items.length,
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!ctx.open) {
                ctx.setOpen(true);
            }
            ctx.setHighlightedIndex(
                (ctx.highlightedIndex - 1 + ctx.items.length) %
                    ctx.items.length,
            );
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (ctx.open && ctx.highlightedIndex >= 0) {
                const item = ctx.items[ctx.highlightedIndex];
                if (item) {
                    ctx.setValue(item.value);
                    ctx.close();
                }
            } else {
                // If closed or no highlight, maybe just toggle?
                // Standard combobox behavior: enter selects if list is open.
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            ctx.close();
        }
    }

    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        ctx.setInputValue(target.value);
        if (!ctx.open) {
            ctx.setOpen(true);
        }
    }
</script>

<div class="relative w-full has-disabled:opacity-50">
    <input
        class={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "has-[+[data-slot=combobox-trigger],+[data-slot=combobox-clear]]:pe-7",
            className,
        )}
        value={ctx.inputValue}
        disabled={ctx.disabled}
        onkeydown={handleKeyDown}
        oninput={handleInput}
        onclick={() => {
            if (!ctx.open) ctx.setOpen(true);
        }}
        data-slot="combobox-input"
        {...restProps}
    />
    {@render children?.()}
</div>
