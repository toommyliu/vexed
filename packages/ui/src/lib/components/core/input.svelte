<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLInputAttributes } from "svelte/elements";

  import { focus } from "$lib/attachments/focus";
  import { validity } from "$lib/attachments/validity";

  interface Props extends Omit<HTMLInputAttributes, "size"> {
    ref?: HTMLInputElement | null;
    value?: any;
    size?: "sm" | "default" | "lg" | number;
    unstyled?: boolean;
  }

  let {
    class: className = undefined,
    ref = $bindable(null),
    value = $bindable(),
    size = "default",
    unstyled = false,
    type = undefined,
    ...restProps
  }: Props = $props();

  let isValid = $state({ value: true });
  let isFocus = $state({ value: false });
  let valid = $derived.by(() => isValid.value);
  let focused = $derived.by(() => isFocus.value);
  let disabled = $derived.by(() => restProps.disabled);
</script>

<span
  class={cn(
    !unstyled && [
      "relative inline-flex w-full rounded-lg border border-input bg-background bg-clip-padding text-sm/5 shadow-xs transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)] before:content-['']",
      focused &&
        !valid &&
        "border-destructive ring-[3px] ring-destructive/20 shadow-none",
      focused && valid && "border-ring ring-[3px] ring-ring/20 shadow-none",
      !focused && !valid && "border-destructive",
      disabled && "opacity-50 shadow-none",
      !focused &&
        valid &&
        !disabled &&
        "before:shadow-[0_1px_rgba(0,0,0,0.04)] dark:before:shadow-[0_-1px_rgba(255,255,255,0.06)]",
      className,
    ],
  ) || undefined}
  data-size={size}
  data-slot="input-control"
>
  <input
    {@attach focus(isFocus)}
    {@attach validity(isValid)}
    class={cn(
      "h-full w-full min-w-0 rounded-[inherit] bg-transparent px-[calc(theme(spacing.3)-1px)] py-[calc(theme(spacing[1.5])-1px)] outline-none focus:outline-none placeholder:text-muted-foreground/64",
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
    bind:this={ref}
    bind:value
    {...restProps}
  />
</span>
