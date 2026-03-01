<script lang="ts">
  import { cn } from "$lib/utils";
  import { getDialogContext } from "../dialog/dialog-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface AlertDialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
    ref?: HTMLParagraphElement | null;
    class?: string;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: AlertDialogDescriptionProps = $props();

  const ctx = getDialogContext();
</script>

<p
  bind:this={ref}
  id={ctx.descriptionId()}
  data-slot="alert-dialog-description"
  class={cn("text-muted-foreground text-sm", className)}
  {...restProps}
>
  {@render children?.()}
</p>
