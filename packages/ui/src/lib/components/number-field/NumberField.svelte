<script lang="ts">
    import { setContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { NumberFieldContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        value?: number;
        onValueChange?: (value: number) => void;
        min?: number;
        max?: number;
        step?: number;
    }

    let {
        value = $bindable(0),
        onValueChange = undefined,
        min = undefined,
        max = undefined,
        step = 1,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    function updateValue(v: number) {
        let newValue = v;
        if (min !== undefined) newValue = Math.max(min, newValue);
        if (max !== undefined) newValue = Math.min(max, newValue);

        if (newValue !== value) {
            value = newValue;
            onValueChange?.(newValue);
        }
    }

    const ctx: NumberFieldContext = {
        get value() {
            return value;
        },
        get min() {
            return min;
        },
        get max() {
            return max;
        },
        get step() {
            return step;
        },
        set value(v) {
            updateValue(v);
        },
        increment() {
            updateValue(value + step);
        },
        decrement() {
            updateValue(value - step);
        },
    };

    setContext("number-field", ctx);
</script>

<div class={cn("grid gap-2", className)} {...restProps}>
    {@render children?.()}
</div>
