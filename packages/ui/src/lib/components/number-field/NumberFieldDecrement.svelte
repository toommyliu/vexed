<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import type { NumberFieldContext } from "./types";

    interface Props extends HTMLButtonAttributes {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();
    const ctx = getContext<NumberFieldContext>("number-field");
</script>

<button
    type="button"
    onclick={() => ctx.decrement()}
    disabled={ctx.min !== undefined && ctx.value <= ctx.min}
    class={cn(
        "absolute bottom-0 right-0 flex h-1/2 w-6 items-center justify-center border-l bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        "rounded-br-md",
        className,
    )}
    {...restProps}
>
    {#if children}
        {@render children()}
    {:else}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6" /></svg
        >
    {/if}
</button>
