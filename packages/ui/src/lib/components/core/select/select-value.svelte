<script lang="ts">
  import { cn } from "$lib/utils";
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

<span
  class={cn("flex-1 min-w-0 truncate text-left data-[placeholder]:text-muted-foreground", className)}
  data-slot="select-value"
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    <span class="text-muted-foreground">{placeholder}</span>
  {/if}
</span>
