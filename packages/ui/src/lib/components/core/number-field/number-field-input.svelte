<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getNumberFieldContext } from "./context.js";

  interface Props extends Omit<HTMLInputAttributes, "value" | "min" | "max" | "step"> {}

  let { class: className = undefined, ...restProps }: Props = $props();

  const ctx = getNumberFieldContext();

  const displayValue = $derived(
    Number.isNaN(ctx.value) ? (ctx.min ?? 0) : ctx.value,
  );

  const heightClass = $derived(
    ctx.size === "sm" ? "h-7 text-xs" : ctx.size === "lg" ? "h-9 text-base" : "h-8 text-sm",
  );

  const paddingClass = $derived(
    ctx.size === "sm" ? "px-2" : ctx.size === "lg" ? "px-3" : "px-2.5",
  );

  function handleInput(e: Event) {
    const parsed = parseFloat((e.currentTarget as HTMLInputElement).value);
    if (!Number.isNaN(parsed)) {
      ctx.setValue(parsed);
    }
  }

  function handleBlur(e: FocusEvent) {
    const input = e.currentTarget as HTMLInputElement;
    let parsed = parseFloat(input.value);
    if (Number.isNaN(parsed)) parsed = ctx.min ?? 0;
    ctx.setValue(parsed);
    input.value = String(ctx.value);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      ctx.increment();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      ctx.decrement();
    }
  }
</script>

<input
  type="number"
  value={displayValue}
  min={ctx.min}
  max={ctx.max}
  step={ctx.step}
  disabled={ctx.disabled}
  oninput={handleInput}
  onblur={handleBlur}
  onkeydown={handleKeydown}
  class={cn(
    "w-full min-w-0 grow bg-transparent text-center tabular-nums text-foreground outline-none",
    "placeholder:text-muted-foreground disabled:cursor-not-allowed",
    heightClass,
    paddingClass,
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
  input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
</style>
