<script>
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";

    let {
        class: className = undefined,
        value,
        children,
        disabled = false,
        ...restProps
    } = $props();

    const ctx = getContext("select");

    let isSelected = $derived(ctx.value === value);
</script>

<button
    type="button"
    role="option"
    aria-selected={isSelected}
    {disabled}
    onclick={() => {
        if (!disabled) {
            ctx.value = value;
            ctx.close();
        }
    }}
    class={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className,
    )}
    {...restProps}
>
    {#if isSelected}
        <span
            class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
            >
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </span>
    {/if}
    {@render children?.()}
</button>
