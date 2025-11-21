<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { fade, scale } from "svelte/transition";
    import { ChevronUp, ChevronDown } from "lucide-svelte";
    import type { HTMLAttributes } from "svelte/elements";

    interface SelectContext {
        value: any;
        open: boolean;
        disabled: boolean;
        toggle: () => void;
        close: () => void;
    }

    interface Props extends HTMLAttributes<HTMLDivElement> {
        sideOffset?: number;
    }

    let {
        sideOffset = 4,
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
        class="absolute z-50 select-none w-full"
        style="top: calc(100% + {sideOffset}px);"
        data-slot="select-positioner"
    >
        <div
            class="origin-top transition-[scale,opacity] duration-100"
            transition:scale={{ start: 0.98, duration: 100 }}
            data-slot="select-popup"
        >
            {#if showScrollUp}
                <div
                    class="top-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:top-px before:h-[200%] before:rounded-t-[calc(theme(borderRadius.lg)-1px)] before:bg-gradient-to-b before:from-50% before:from-popover"
                    data-slot="select-scroll-up-arrow"
                >
                    <ChevronUp class="relative size-4" />
                </div>
            {/if}
            <span
                class="relative block h-full rounded-lg border bg-popover bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)] before:shadow-lg dark:bg-clip-border"
            >
                <div
                    bind:this={listElement}
                    onscroll={handleScroll}
                    class={cn(
                        "max-h-60 min-w-[var(--anchor-width)] overflow-y-auto p-1",
                        className,
                    )}
                    data-slot="select-list"
                    {...restProps}
                >
                    {@render children?.()}
                </div>
            </span>
            {#if showScrollDown}
                <div
                    class="bottom-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:bottom-px before:h-[200%] before:rounded-b-[calc(theme(borderRadius.lg)-1px)] before:bg-gradient-to-t before:from-50% before:from-popover"
                    data-slot="select-scroll-down-arrow"
                >
                    <ChevronDown class="relative size-4" />
                </div>
            {/if}
        </div>
    </div>
{/if}
