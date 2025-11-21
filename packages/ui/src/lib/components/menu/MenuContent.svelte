<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { scale } from "svelte/transition";
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
</script>

{#if ctx.open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50" onclick={() => ctx.close()}></div>
    <div
        class={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            "top-[calc(100%+4px)]",
            align === "end" ? "right-0" : "left-0",
            className,
        )}
        transition:scale={{ start: 0.95, duration: 100 }}
        {...restProps}
    >
        {@render children?.()}
    </div>
{/if}
