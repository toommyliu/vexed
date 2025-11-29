<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { motionScale } from "$lib/util/motion";
    import type { HTMLAttributes } from "svelte/elements";
    import type { ComboboxContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        sideOffset?: number;
    }

    let {
        sideOffset = 4,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<ComboboxContext>("combobox");
</script>

{#if ctx.open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50" onclick={() => ctx.close()}></div>
    <div
        class="absolute z-50 select-none"
        style="top: calc(100% + {sideOffset}px);"
        data-slot="combobox-positioner"
    >
        <div
            class="origin-top transition-[scale,opacity] duration-100"
            transition:motionScale={{ start: 0.98, duration: 100 }}
            data-slot="combobox-popup"
        >
            <div
                class={cn(
                    "relative flex max-h-full flex-col overflow-hidden rounded-lg border bg-popover bg-clip-padding text-popover-foreground shadow-md transition-[scale,opacity] dark:bg-clip-border",
                    className,
                )}
                {...restProps}
            >
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}
