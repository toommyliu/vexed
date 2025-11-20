<script>
  import { cn } from "$lib/util/cn";

  let {
    class: className = undefined,
    value = $bindable(""),
    type = "text",
    placeholder = "",
    disabled = false,
    required = false,
    autocomplete = "off",
    id = undefined,
    size = "default",
    unstyled = false,
    ...restProps
  } = $props();
</script>

<span
  class={cn(
    !unstyled &&
      "relative inline-flex w-full rounded-lg border border-input bg-background bg-clip-padding text-base shadow-sm transition-shadow",
    !unstyled &&
      "focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-primary",
    !unstyled && disabled && "opacity-50 cursor-not-allowed",
    className,
  )}
  data-size={size}
  data-slot="input-control"
>
  <input
    {type}
    {id}
    {placeholder}
    {disabled}
    {required}
    {autocomplete}
    bind:value
    class={cn(
      "w-full min-w-0 rounded-[inherit] bg-transparent px-3 py-1.5 outline-none placeholder:text-muted-foreground/60",
      size === "sm" && "px-2.5 py-1 text-sm",
      size === "default" && "px-3 py-1.5 text-sm",
      size === "lg" && "px-4 py-2 text-base",
      type === "file" &&
        "text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm",
    )}
    data-slot="input"
    {...restProps}
  />
</span>
