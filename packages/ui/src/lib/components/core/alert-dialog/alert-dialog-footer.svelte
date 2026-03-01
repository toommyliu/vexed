<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    variant = "default",
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: "default" | "bare";
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert-dialog-footer"
  class={cn(
    "flex flex-col-reverse gap-2 px-6 sm:flex-row sm:justify-end [&>button]:w-full [&>button]:sm:w-auto",
    variant === "default" && "border-t bg-muted/72 py-4",
    variant === "bare" && "pb-6",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
