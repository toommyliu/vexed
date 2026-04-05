<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  type Orientation = "vertical" | "horizontal";

  interface Props extends HTMLAttributes<HTMLElement> {
    orientation?: Orientation;
    /** When true, wraps children in an orientation-aware layout container. */
    wrapChildren?: boolean;
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
    orientation = "vertical",
    wrapChildren = false,
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
    "z-10 border-border/50 bg-background/95",
    orientation === "vertical"
      ? "sticky top-0 border-b px-6 py-1"
      : "sticky left-0 h-screen w-64 border-r px-4 py-4",
    className,
  )}
  data-slot="app-frame-header"
  data-orientation={orientation}
  {...restProps}
>
  {#if children}
    {#if wrapChildren && orientation === "horizontal"}
      <div class="flex h-full flex-col">
        {@render children()}
      </div>
    {:else}
      {@render children()}
    {/if}
  {:else}
    <div
      class={cn(
        "mx-auto",
        orientation === "vertical"
          ? "flex items-center justify-between"
          : "flex h-full flex-col",
        maxWidth !== "none" && maxWidth,
      )}
    >
      <div
        class={cn(
          "flex items-center gap-2",
          orientation === "horizontal" && "flex-col items-start",
        )}
      >
        {#if title}
          <h1
            class="flex h-9 items-center text-base font-semibold tracking-tight text-foreground"
          >
            {title}
          </h1>
        {/if}
        {@render left?.()}
      </div>
      {#if right}
        <div
          class={cn(
            "flex items-center gap-2",
            orientation === "horizontal" && "mt-auto pt-4",
          )}
        >
          {@render right()}
        </div>
      {/if}
    </div>
  {/if}
</header>
