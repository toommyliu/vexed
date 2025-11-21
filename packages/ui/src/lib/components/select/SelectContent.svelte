<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { motionScale } from "$lib/util/motion";
    import { ChevronUp, ChevronDown } from "lucide-svelte";
    import type { HTMLAttributes } from "svelte/elements";
    import type { SelectContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        sideOffset?: number;
        side?: "top" | "bottom";
    }

    let {
        sideOffset = 4,
        side = "bottom",
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<SelectContext>("select");

    let listElement = $state<HTMLDivElement>();
    let showScrollUp = $state(false);
    let showScrollDown = $state(false);

    function handleScroll() {
        if (!listElement) return;
        showScrollUp = listElement.scrollTop > 0;
        showScrollDown =
            listElement.scrollTop <
            listElement.scrollHeight - listElement.clientHeight - 1;
    }

    $effect(() => {
        if (ctx.open && listElement) {
            handleScroll();
        }
    });
</script>

{#if ctx.open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50" onclick={() => ctx.close()}></div>
    <div
        class="absolute z-50 select-none"
        style={side === "bottom"
            ? `top: calc(100% + ${sideOffset}px);`
            : `bottom: calc(100% + ${sideOffset}px);`}
        data-slot="select-positioner"
    >
        <div
            class={cn(
                "transition-[scale,opacity] duration-100",
                side === "bottom" ? "origin-top" : "origin-bottom",
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
                    <div
                        bind:this={listElement}
                        onscroll={handleScroll}
                        class={cn(
                            "max-h-60 min-w-[var(--anchor-width)] overflow-y-auto p-1 transition-[padding] duration-150",
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
