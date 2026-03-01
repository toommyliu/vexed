<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  interface Props extends HTMLAttributes<HTMLElement> {
    /** Renders a styled <h1> title on the left side of the header. */
    title?: string;
    /**
     * Content rendered to the right of the title in the left section.
     */
    left?: Snippet;
    /** Content rendered in the right section (action buttons, controls, etc.). */
    right?: Snippet;
    /**
     * Escape hatch for fully custom header content. When provided,
     * the title/left/right layout is bypassed entirely.
     */
    children?: Snippet;
    /**
     * Tailwind max-width class for the inner centering wrapper.
     * Defaults to "max-w-7xl". Pass "none" to omit the wrapper entirely.
     */
    maxWidth?: string;
  }

  let {
    class: className = undefined,
    title,
    left,
    right,
    children,
    maxWidth = "max-w-7xl",
    ...restProps
  }: Props = $props();
</script>

<header
  class={cn(
    "elevation-1 sticky top-0 z-10 border-b border-border/50 bg-background/95 px-6 py-3",
    className,
  )}
  data-slot="app-frame-header"
  {...restProps}
>
  {#if children}
    {@render children()}
  {:else}
    <div
      class={cn(
        "mx-auto flex items-center justify-between",
        maxWidth !== "none" && maxWidth,
      )}
    >
      <div class="flex items-center gap-3">
        {#if title}
          <h1 class="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        {/if}
        {@render left?.()}
      </div>
      {#if right}
        <div class="flex items-center gap-2">
          {@render right()}
        </div>
      {/if}
    </div>
  {/if}
</header>
