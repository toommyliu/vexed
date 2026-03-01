<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { setNumberFieldContext, type NumberFieldSize } from "./context.js";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    value?: number;
    onValueChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    size?: NumberFieldSize;
    disabled?: boolean;
  }

  let {
    value = $bindable(0),
    onValueChange = undefined,
    min = undefined,
    max = undefined,
    step = 1,
    size = "default",
    disabled = false,
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();

  function stepDecimals(s: number): number {
    const str = String(s);
    const dot = str.indexOf(".");
    return dot === -1 ? 0 : str.length - dot - 1;
  }

  function roundToStep(v: number): number {
    const decimals = stepDecimals(step);
    return decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v);
  }

  function clamp(v: number): number {
    let result = v;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  }

  function setValue(v: number) {
    const next = clamp(roundToStep(v));
    if (next !== value) {
      value = next;
      onValueChange?.(next);
    }
  }

  setNumberFieldContext({
    get value() { return value; },
    get min() { return min; },
    get max() { return max; },
    get step() { return step; },
    get size() { return size; },
    get disabled() { return disabled; },
    increment() { setValue(value + step); },
    decrement() { setValue(value - step); },
    setValue,
  });
</script>

<div class={cn("flex w-full flex-col items-start gap-2", className)} {...restProps}>
  {@render children?.()}
</div>
