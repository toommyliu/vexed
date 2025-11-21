<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import { Plus } from "lucide-svelte";
    import type { HTMLButtonAttributes } from "svelte/elements";

    interface NumberFieldContext {
        value: number;
        min?: number;
        max?: number;
        step: number;
        increment: () => void;
        decrement: () => void;
    }

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
    onclick={() => ctx.increment()}
    disabled={ctx.max !== undefined && ctx.value >= ctx.max}
    class={cn(
        "absolute right-0 top-0 flex h-1/2 w-6 items-center justify-center border-l bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        "rounded-tr-md border-b",
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
            class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6" /></svg
        >
    {/if}
</button>
