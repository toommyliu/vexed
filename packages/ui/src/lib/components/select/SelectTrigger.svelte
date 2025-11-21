<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { ChevronsUpDown } from "lucide-svelte";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import type { SelectContext } from "./types";

    interface Props extends HTMLButtonAttributes {
        size?: "sm" | "default" | "lg";
    }

    let {
        size = "default",
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<SelectContext>("select");
    let buttonElement = $state<HTMLButtonElement>();

    $effect(() => {
        if (buttonElement) {
            ctx.setAnchorWidth(buttonElement.offsetWidth);
        }
    });
</script>

<button
    bind:this={buttonElement}
    type="button"
    onclick={() => ctx.toggle()}
    class={cn(
        "relative inline-flex select-none rounded-lg border border-input bg-background bg-clip-padding text-base/5 shadow-xs outline-none ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)] focus-visible:border-ring focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 sm:text-sm dark:bg-input/32 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-72",
        size === "sm" && "gap-1.5 px-2 py-1 text-sm",
        size === "default" && "gap-2 px-3 py-1.5",
        size === "lg" && "gap-2 px-3 py-2",
        className,
    )}
    aria-expanded={ctx.open}
    disabled={ctx.disabled}
    data-slot="select-trigger"
    {...restProps}
>
    {@render children?.()}
    <span data-slot="select-icon" class="-me-1 opacity-72">
        <ChevronsUpDown class="size-4" />
    </span>
</button>
