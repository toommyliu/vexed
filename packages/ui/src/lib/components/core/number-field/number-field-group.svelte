<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { getNumberFieldContext } from "./context.js";

  interface Props extends HTMLAttributes<HTMLDivElement> {}

  let { class: className = undefined, children, ...restProps }: Props = $props();

  const ctx = getNumberFieldContext();
</script>

<div
  class={cn(
    "relative flex w-full items-center overflow-hidden rounded-md border border-input bg-background text-sm shadow-sm ring-ring/30 transition-shadow",
    "focus-within:border-ring focus-within:ring-2",
    ctx.disabled && "pointer-events-none opacity-50",
    className,
  )}
  data-disabled={ctx.disabled || undefined}
  {...restProps}
>
  {@render children?.()}
</div>
