<script lang="ts">
  import { cn } from "$lib/utils";
  import { getDialogContext } from "./dialog-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    ref?: HTMLHeadingElement | null;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: DialogTitleProps = $props();

  const ctx = getDialogContext();
</script>

<h2
  bind:this={ref}
  id={ctx.titleId()}
  data-slot="dialog-title"
  class={cn("font-heading font-semibold text-xl leading-none", className)}
  {...restProps}
>
  {@render children?.()}
</h2>
