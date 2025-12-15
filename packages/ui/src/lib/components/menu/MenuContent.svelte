<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { motionScale } from "$lib/util/motion";
    import type { HTMLAttributes } from "svelte/elements";
    import type { MenuContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        align?: "start" | "end";
    }

    let {
        class: className = undefined,
        children,
        align = "start",
        ...restProps
    }: Props = $props();

    const ctx = getContext<MenuContext>("menu");

    let contentElement = $state<HTMLDivElement>();

    function getNextEnabledIndex(
        currentIndex: number,
        direction: 1 | -1,
    ): number {
        if (ctx.items.length === 0) return -1;
        let index = currentIndex;
        for (let i = 0; i < ctx.items.length; i++) {
            index = (index + direction + ctx.items.length) % ctx.items.length;
            if (!ctx.items[index].disabled) return index;
        }
        return -1;
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = getNextEnabledIndex(ctx.highlightedIndex, 1);
            if (next !== -1) ctx.setHighlightedIndex(next);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = getNextEnabledIndex(ctx.highlightedIndex, -1);
            if (prev !== -1) ctx.setHighlightedIndex(prev);
        } else if (e.key === "Escape") {
            e.preventDefault();
            ctx.close();
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (ctx.highlightedIndex >= 0) {
                ctx.selectHighlighted();
            }
        }
    }

    $effect(() => {
        if (ctx.open && contentElement) {
            contentElement.focus();
            if (ctx.highlightedIndex === -1) {
                const firstEnabled = ctx.items.findIndex((i) => !i.disabled);
                if (firstEnabled !== -1) {
                    ctx.setHighlightedIndex(firstEnabled);
                }
            }
        }
    });
</script>

{#if ctx.open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50" onclick={() => ctx.close()}></div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
        bind:this={contentElement}
        role="menu"
        tabindex="0"
        class={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md bg-popover p-1 text-popover-foreground shadow-md outline-none",
            "top-[calc(100%+4px)]",
            align === "end" ? "right-0" : "left-0",
            className,
        )}
        transition:motionScale={{ start: 0.95, duration: 100 }}
        onkeydown={handleKeyDown}
        {...restProps}
    >
        {@render children?.()}
    </div>
{/if}
