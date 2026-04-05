<script lang="ts">
  import { cn } from "$lib/utils";
  import { getMenuContext } from "./menu-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface MenuTriggerProps extends HTMLButtonAttributes {
    ref?: HTMLButtonElement | null;
    child?: Snippet;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    child,
    children,
    disabled,
    ...restProps
  }: MenuTriggerProps = $props();

  const ctx = getMenuContext();

  $effect(() => {
    ctx.setTriggerEl(ref);
    return () => ctx.setTriggerEl(null);
  });
</script>

<button
  bind:this={ref}
  type="button"
  data-slot="menu-trigger"
  aria-haspopup="menu"
  aria-expanded={ctx.open()}
  {disabled}
  onclick={(e) => {
    e.stopPropagation();
    ctx.setOpen(!ctx.open());
  }}
  class={cn(className)}
  {...restProps}
>
  {@render children?.()}
</button>
