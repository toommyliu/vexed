<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { SelectContext } from "./types";

    interface Props extends HTMLAttributes<HTMLButtonElement> {
        value: any;
        disabled?: boolean;
    }

    let {
        value,
        disabled = false,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<SelectContext>("select");

    let isSelected = $derived(ctx.value === value);

    function handleSelect() {
        if (disabled) return;
        ctx.value = value;
        ctx.close();
    }
</script>

<button
    type="button"
    role="option"
    aria-selected={isSelected}
    {disabled}
    onclick={handleSelect}
    class={cn(
        "relative w-full flex cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&[data-disabled]]:cursor-not-allowed [&[data-disabled]]:opacity-50 [&[data-disabled]]:pointer-events-none [&[data-disabled]:hover]:bg-transparent",
        className,
    )}
    data-slot="select-item"
    data-disabled={disabled ? "" : undefined}
    {...restProps}
>
    <span class="flex-1 min-w-0 text-start">
        {@render children?.()}
    </span>
    {#if isSelected}
        <svg
            fill="none"
            height="24"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="24"
            class="size-4 text-primary shrink-0"
        >
            <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
    {/if}
</button>
