<script lang="ts">
  import { cn } from "$lib/util/cn";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends Omit<HTMLInputAttributes, "size"> {
    value?: any;
    size?: "sm" | "default" | "lg" | number;
    unstyled?: boolean;
  }

  let {
    class: className = undefined,
    value = $bindable(),
    size = "default",
    unstyled = false,
    type = undefined,
    ...restProps
  }: Props = $props();
</script>

<span
  class={cn(
    !unstyled &&
      "relative inline-flex w-full rounded-lg border border-input bg-background bg-clip-padding text-sm/5 shadow-xs ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)] not-has-[:disabled]:not-has-[:focus-visible]:not-has-[aria-invalid]:before:shadow-[0_1px_theme(colors.black/4%)] has-[:focus-visible]:has-[aria-invalid]:border-destructive/64 has-[:focus-visible]:has-[aria-invalid]:ring-destructive/16 has-[aria-invalid]:border-destructive/36 has-[:focus-visible]:border-ring has-[:disabled]:opacity-50 has-[:disabled]:shadow-none has-[:focus-visible]:shadow-none has-[aria-invalid]:shadow-none has-[:focus-visible]:ring-[3px] dark:bg-input/32 dark:not-in-data-[slot=group]:bg-clip-border dark:has-[aria-invalid]:ring-destructive/24 dark:not-has-[:disabled]:not-has-[:focus-visible]:not-has-[aria-invalid]:before:shadow-[0_-1px_theme(colors.white/8%)]",
    className,
  ) || undefined}
  data-size={size}
  data-slot="input-control"
>
  <input
    class={cn(
      "w-full min-w-0 rounded-[inherit] bg-transparent px-[calc(theme(spacing.3)-1px)] py-[calc(theme(spacing[1.5])-1px)] outline-none placeholder:text-muted-foreground/64 placeholder:text-xs",
      size === "sm" &&
        "px-[calc(theme(spacing[2.5])-1px)] py-[calc(theme(spacing.1)-1px)]",
      size === "lg" && "py-[calc(theme(spacing.2)-1px)]",
      type === "search" &&
        "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
      type === "file" &&
        "text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm",
    )}
    data-slot="input"
    {type}
    bind:value
    {...restProps}
  />
</span>
