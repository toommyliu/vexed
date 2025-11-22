<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        orientation?: "horizontal" | "vertical";
        ref?: HTMLDivElement;
    }

    let {
        class: className,
        orientation = "horizontal",
        ref = $bindable(),
        ...props
    }: Props = $props();
</script>

<div
    bind:this={ref}
    class={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className,
    )}
    data-slot="separator"
    data-orientation={orientation}
    {...props}
></div>
