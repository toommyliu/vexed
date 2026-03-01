<script lang="ts">
  import { buttonVariants } from "$lib/components/core/button.svelte";
  import { cn } from "$lib/utils";
  import { getDialogContext } from "../dialog/dialog-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface AlertDialogActionProps extends HTMLButtonAttributes {
    ref?: HTMLButtonElement | null;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    children,
    onclick,
    ...restProps
  }: AlertDialogActionProps = $props();

  const ctx = getDialogContext();

  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    onclick?.(e);
    ctx.close();
  }
</script>

<button
  bind:this={ref}
  type="button"
  data-slot="alert-dialog-action"
  class={cn(buttonVariants({ variant: "destructive" }), className)}
  onclick={handleClick}
  {...restProps}
>
  {@render children?.()}
</button>
