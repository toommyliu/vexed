<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { motionScale } from "$lib/util/motion";
    import ChevronUp from "lucide-svelte/icons/chevron-up";
    import ChevronDown from "lucide-svelte/icons/chevron-down";
    import type { HTMLAttributes } from "svelte/elements";
    import type { SelectContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        sideOffset?: number;
        side?: "top" | "bottom" | "auto";
    }

    let {
        sideOffset = 4,
        side = "auto",
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<SelectContext>("select");

    let listElement = $state<HTMLDivElement>();
    let positionerElement = $state<HTMLDivElement>();
    let showScrollUp = $state(false);
    let showScrollDown = $state(false);
    let resolvedSide = $state<"top" | "bottom">("bottom");

    function handleScroll() {
        if (!listElement) return;
        showScrollUp = listElement.scrollTop > 0;
        showScrollDown =
            listElement.scrollTop <
            listElement.scrollHeight - listElement.clientHeight - 1;
    }

    function calculateOptimalSide(): "top" | "bottom" {
        if (side !== "auto") return side;
        if (!positionerElement) return "bottom";

        const parent = positionerElement.parentElement;
        if (!parent) return "bottom";

        const rect = parent.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        const estimatedDropdownHeight = 260;

        if (spaceBelow >= estimatedDropdownHeight) return "bottom";
        if (spaceAbove > spaceBelow) return "top";
        return "bottom";
    }

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
        if (ctx.open) {
            resolvedSide = calculateOptimalSide();
            if (listElement) {
                handleScroll();
                listElement.focus();
                if (ctx.highlightedIndex === -1) {
                    const selectedIndex = ctx.items.findIndex(
                        (i) => i.value === ctx.value,
                    );
                    if (
                        selectedIndex !== -1 &&
                        !ctx.items[selectedIndex].disabled
                    ) {
                        ctx.setHighlightedIndex(selectedIndex);
                    } else {
                        const firstEnabled = ctx.items.findIndex(
                            (i) => !i.disabled,
                        );
                        if (firstEnabled !== -1) {
                            ctx.setHighlightedIndex(firstEnabled);
                        }
                    }
                }
            }
        }
    });
</script>

{#if ctx.open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50" onclick={() => ctx.close()}></div>
    <div
        bind:this={positionerElement}
        class="absolute z-50 select-none"
        style={resolvedSide === "bottom"
            ? `top: calc(100% + ${sideOffset}px);`
            : `bottom: calc(100% + ${sideOffset}px);`}
        data-slot="select-positioner"
    >
        <div
            class={cn(
                "transition-[scale,opacity] duration-100",
                resolvedSide === "bottom" ? "origin-top" : "origin-bottom",
            )}
            transition:motionScale={{ start: 0.98, duration: 100 }}
            data-slot="select-popup"
        >
            <div class="relative">
                <div
                    class="pointer-events-none absolute left-0 right-0 top-0 z-50 flex h-6 w-full cursor-default items-center justify-center overflow-hidden transition-opacity duration-150 before:pointer-events-none before:absolute before:inset-x-px before:top-px before:h-full before:rounded-t-[calc(theme(borderRadius.lg)-1px)] before:bg-gradient-to-b before:from-50% before:from-popover"
                    class:opacity-0={!showScrollUp}
                    class:opacity-100={showScrollUp}
                    data-slot="select-scroll-up-arrow"
                >
                    <ChevronUp class="relative size-4" />
                </div>
                <span
                    class="relative block rounded-lg border bg-popover bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)] before:shadow-lg dark:bg-clip-border"
                >
                    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                    <div
                        bind:this={listElement}
                        role="listbox"
                        tabindex="0"
                        onscroll={handleScroll}
                        onkeydown={handleKeyDown}
                        class={cn(
                            "max-h-60 min-w-[var(--anchor-width)] overflow-y-auto p-1 transition-[padding] duration-150 outline-none",
                            showScrollUp && "pt-7",
                            showScrollDown && "pb-7",
                            className,
                        )}
                        data-slot="select-list"
                        {...restProps}
                    >
                        {@render children?.()}
                    </div>
                </span>
                <div
                    class="pointer-events-none absolute bottom-0 left-0 right-0 z-50 flex h-6 w-full cursor-default items-center justify-center overflow-hidden transition-opacity duration-150 before:pointer-events-none before:absolute before:inset-x-px before:bottom-px before:h-full before:rounded-b-[calc(theme(borderRadius.lg)-1px)] before:bg-gradient-to-t before:from-50% before:from-popover"
                    class:opacity-0={!showScrollDown}
                    class:opacity-100={showScrollDown}
                    data-slot="select-scroll-down-arrow"
                >
                    <ChevronDown class="relative size-4" />
                </div>
            </div>
        </div>
    </div>
{/if}
