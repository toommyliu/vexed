<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        orientation?: "horizontal" | "vertical";
    }

    let {
        class: className = undefined,
        orientation = "vertical",
        ...restProps
    }: Props = $props();
</script>

<div
    class={cn(
        "bg-border shrink-0",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        "[[data-slot=input-control]:focus-within+&]:-translate-x-px [[data-slot=select-trigger]:focus-visible+*+&]:-translate-x-px relative z-20 has-[+[data-slot=input-control]:focus-within]:translate-x-px has-[+[data-slot=select-trigger]:focus-visible+*]:translate-x-px has-[+[data-slot=number-field]:focus-within]:translate-x-px has-[+[data-slot=input-control]:focus-within]:bg-ring has-[+[data-slot=select-trigger]:focus-visible+*]:bg-ring has-[+[data-slot=number-field]:focus-within]:bg-ring [[data-slot=input-control]:focus-within+&]:bg-ring [[data-slot=select-trigger]:focus-visible+*+&]:bg-ring [[data-slot=number-field]:focus-within+&]:bg-ring",
        className,
    )}
    role="separator"
    aria-orientation={orientation}
    {...restProps}
></div>
