<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface SelectContext {
        value: any;
        open: boolean;
        disabled: boolean;
        toggle: () => void;
        close: () => void;
    }

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
    onmouseenter={(e) => e.currentTarget.setAttribute("data-highlighted", "")}
    onmouseleave={(e) => e.currentTarget.removeAttribute("data-highlighted")}
    class={cn(
        "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 text-base outline-none [&[data-disabled]]:pointer-events-none [&[data-highlighted]]:bg-accent [&[data-highlighted]]:text-accent-foreground [&[data-disabled]]:opacity-64 sm:text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
    )}
    data-slot="select-item"
    data-disabled={disabled ? "" : undefined}
    {...restProps}
>
    <span class="col-start-1">
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
                class="size-4"
            >
                <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
            </svg>
        {/if}
    </span>
    <span class="col-start-2 min-w-0">
        {@render children?.()}
    </span>
</button>
