<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { getNumberFieldContext } from "./context.js";
  import PlusIcon from "$lib/components/core/icons/_icons/plus.svelte";

  interface Props extends HTMLButtonAttributes {}

  let { class: className = undefined, children, ...restProps }: Props = $props();

  const ctx = getNumberFieldContext();

  const isDisabled = $derived(
    ctx.disabled || (ctx.max !== undefined && ctx.value >= ctx.max),
  );

  const paddingClass = $derived(
    ctx.size === "sm" ? "px-2" : ctx.size === "lg" ? "px-3" : "px-2.5",
  );
</script>

<button
  type="button"
  onclick={() => ctx.increment()}
  disabled={isDisabled}
  class={cn(
    "flex shrink-0 cursor-pointer items-center justify-center self-stretch border-l border-input/60 text-muted-foreground transition-colors",
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
    <PlusIcon class="size-3.5" />
  {/if}
</button>
