<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { getNumberFieldContext } from "./context.js";
  import MinusIcon from "$lib/components/core/icons/_icons/minus.svelte";

  interface Props extends HTMLButtonAttributes {}

  let { class: className = undefined, children, ...restProps }: Props = $props();

  const ctx = getNumberFieldContext();

  const isDisabled = $derived(
    ctx.disabled || (ctx.min !== undefined && ctx.value <= ctx.min),
  );

  const paddingClass = $derived(
    ctx.size === "sm" ? "px-2" : ctx.size === "lg" ? "px-3" : "px-2.5",
  );
</script>

<button
  type="button"
  onclick={() => ctx.decrement()}
  disabled={isDisabled}
  class={cn(
    "flex shrink-0 cursor-pointer items-center justify-center self-stretch border-r border-input/60 text-muted-foreground transition-colors",
    "hover:bg-muted",
    "disabled:pointer-events-none disabled:opacity-40",
    paddingClass,
    className,
  )}
  {...restProps}
>
  {#if children}
    {@render children()}
  {:else}
    <MinusIcon class="size-3.5" />
  {/if}
</button>
