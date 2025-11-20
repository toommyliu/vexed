<script>
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { fade, scale } from "svelte/transition";

    let { class: className = undefined, children, ...restProps } = $props();
    const ctx = getContext("select");
</script>

{#if ctx.open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50" onclick={() => ctx.close()}></div>
    <div
        class={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-full top-[calc(100%+4px)]",
            className,
        )}
        transition:scale={{ start: 0.95, duration: 100 }}
        {...restProps}
    >
        <div class="p-1">
            {@render children?.()}
        </div>
    </div>
{/if}
