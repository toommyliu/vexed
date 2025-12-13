<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        render?: Snippet;
    }

    let {
        class: className = undefined,
        children = undefined,
        render = undefined,
        ...restProps
    }: Props = $props();
</script>

<div
    class={cn(
        "relative inline-flex items-center whitespace-nowrap rounded-lg border border-border bg-muted bg-clip-padding px-[calc(0.75rem-1px)] font-medium text-sm shadow-sm outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius)-1px)] before:shadow-[0_1px_rgba(0,0,0,0.04)] dark:bg-input/64 dark:before:shadow-[0_-1px_rgba(255,255,255,0.08)] [&_svg:not([class*='size-'])]:w-4 [&_svg:not([class*='size-'])]:h-4 [&_svg]:shrink-0",
        className,
    )}
    data-slot="group-text"
    {...restProps}
>
    {#if render}
        {@render render()}
    {:else}
        {@render children?.()}
    {/if}
</div>
