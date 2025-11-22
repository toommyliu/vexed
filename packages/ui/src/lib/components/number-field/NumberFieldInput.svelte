<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLInputAttributes } from "svelte/elements";
    import type { NumberFieldContext } from "./types";

    interface Props extends Omit<HTMLInputAttributes, "value"> {}

    let { class: className = undefined, ...restProps }: Props = $props();
    const ctx = getContext<NumberFieldContext>("number-field");
</script>

<input
    type="number"
    value={ctx.value}
    min={ctx.min}
    max={ctx.max}
    step={ctx.step}
    oninput={(e) => (ctx.value = parseFloat(e.currentTarget.value))}
    class={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
    )}
    {...restProps}
/>

<style>
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>
