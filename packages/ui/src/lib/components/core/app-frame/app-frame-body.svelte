<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  interface Props extends HTMLAttributes<HTMLElement> {
    children?: Snippet;
    /**
     * When true (default), the body scrolls internally (overflow-auto).
     * When false, overflow is hidden and the inner wrapper becomes a
     * flex column filling available height — for views that manage
     * their own internal scrolling regions.
     */
    scroll?: boolean;
    /**
     * Tailwind max-width class for the inner centering wrapper.
     * Defaults to "max-w-7xl". Pass "none" to omit the wrapper entirely.
     */
    maxWidth?: string;
  }

  let {
    class: className = undefined,
    children,
    scroll = true,
    maxWidth = "max-w-7xl",
    ...restProps
  }: Props = $props();
</script>

<main
  class={cn(
    "flex-1 p-4 sm:p-6",
    scroll ? "overflow-auto" : "overflow-hidden",
    className,
  )}
  data-slot="app-frame-body"
  {...restProps}
>
  {#if maxWidth !== "none"}
    <div
      class={cn(
        "mx-auto",
        maxWidth,
        !scroll && "flex h-full flex-col",
      )}
    >
      {@render children?.()}
    </div>
  {:else}
    {@render children?.()}
  {/if}
</main>
