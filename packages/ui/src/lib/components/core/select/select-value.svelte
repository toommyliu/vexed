<script lang="ts">
  import { cn } from "$lib/utils";
  import { Select } from "@ark-ui/svelte/select";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    placeholder?: string;
  }

  let {
    placeholder = "Select...",
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();
</script>

<Select.ValueText
  {placeholder}
  data-slot="select-value"
  class={cn(
    "flex-1 min-w-0 truncate text-left data-[placeholder]:text-muted-foreground",
    className,
  )}
  {...restProps}
/>
