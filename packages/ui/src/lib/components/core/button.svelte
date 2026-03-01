<script module lang="ts">
  import { tv, type VariantProps } from "tailwind-variants";
  import type {
    HTMLButtonAttributes,
    HTMLAnchorAttributes,
  } from "svelte/elements";
  import type { Snippet } from "svelte";

  export const buttonVariants = tv({
    base: [
      "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2",
      "whitespace-nowrap rounded-lg border bg-clip-padding font-medium text-sm outline-none",
      "transition-shadow",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-[var(--button-radius,7px)]",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50",
      "[&_svg:not([class*='size-'])]:w-4 [&_svg:not([class*='size-'])]:h-4",
      "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    ],
    variants: {
      variant: {
        default: [
          "border-primary bg-primary text-primary-foreground",
          "shadow-xs shadow-primary/24",
          "hover:bg-primary/90",
          "active:shadow-none data-[pressed]:shadow-none",
          "disabled:shadow-none active:shadow-none data-[pressed]:shadow-none",
          "before:shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
          "active:before:shadow-[inset_0_1px_0_rgba(0,0,0,0.08)]",
          "data-[pressed]:before:shadow-[inset_0_1px_0_rgba(0,0,0,0.08)]",
          "disabled:before:shadow-none",
        ],
        destructive: [
          "border-destructive bg-destructive text-white",
          "shadow-xs shadow-destructive/24",
          "hover:bg-destructive/90",
          "active:shadow-none data-[pressed]:shadow-none",
          "disabled:shadow-none active:shadow-none data-[pressed]:shadow-none",
          "before:shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
          "active:before:shadow-[inset_0_1px_0_rgba(0,0,0,0.08)]",
          "data-[pressed]:before:shadow-[inset_0_1px_0_rgba(0,0,0,0.08)]",
          "disabled:before:shadow-none",
        ],
        "destructive-outline": [
          "border-border bg-popover text-destructive",
          "shadow-xs",
          "dark:bg-input/32 dark:bg-clip-border",
          "disabled:shadow-none active:shadow-none data-[pressed]:shadow-none",
          "hover:border-destructive/32 data-[pressed]:border-destructive/32",
          "hover:bg-destructive/4 data-[pressed]:bg-destructive/4",
          "before:shadow-[0_1px_0_rgba(0,0,0,0.04)]",
          "dark:before:shadow-[0_-1px_0_rgba(255,255,255,0.06)]",
          "disabled:before:shadow-none",
          "active:before:shadow-none",
          "data-[pressed]:before:shadow-none",
        ],
        success: [
          "border-green-600 bg-green-600 text-white",
          "shadow-xs shadow-green-600/24",
          "hover:bg-green-600/90",
          "active:shadow-none data-[pressed]:shadow-none",
          "disabled:shadow-none active:shadow-none data-[pressed]:shadow-none",
          "before:shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
          "active:before:shadow-[inset_0_1px_0_rgba(0,0,0,0.08)]",
          "data-[pressed]:before:shadow-[inset_0_1px_0_rgba(0,0,0,0.08)]",
          "disabled:before:shadow-none",
        ],
        outline: [
          "border-border bg-popover shadow-xs",
          "dark:bg-input/32 dark:bg-clip-border",
          "disabled:shadow-none active:shadow-none data-[pressed]:shadow-none",
          "hover:bg-accent/50 data-[pressed]:bg-accent/50",
          "dark:hover:bg-input/64 dark:data-[pressed]:bg-input/64",
          "before:shadow-[0_1px_0_rgba(0,0,0,0.04)]",
          "dark:before:shadow-[0_-1px_0_rgba(255,255,255,0.06)]",
          "disabled:before:shadow-none",
          "active:before:shadow-none",
          "data-[pressed]:before:shadow-none",
        ],
        secondary: [
          "border-secondary bg-secondary text-secondary-foreground",
          "shadow-xs",
          "hover:bg-secondary/90",
          "data-[pressed]:bg-secondary/90",
        ],
        ghost: [
          "border-transparent bg-accent/50",
          "hover:bg-accent",
          "data-[pressed]:bg-accent",
        ],
        link: ["border-transparent", "underline-offset-4 hover:underline"],
      },
      size: {
        xs: [
          "h-6 gap-1 rounded-md px-[7px] text-xs",
          "before:rounded-[var(--button-radius,5px)]",
          "[&_svg:not([class*='size-'])]:w-3 [&_svg:not([class*='size-'])]:h-3",
        ],
        sm: ["h-7 gap-1.5 px-[9px]"],
        default: ["h-8 px-[11px]"],
        lg: ["h-9 px-[13px]"],
        xl: [
          "h-10 px-[15px] text-base",
          "[&_svg:not([class*='size-'])]:w-[18px] [&_svg:not([class*='size-'])]:h-[18px]",
        ],
        "icon-xs": [
          "h-6 w-6 rounded-md",
          "before:rounded-[var(--button-radius,5px)]",
        ],
        "icon-sm": ["h-7 w-7"],
        icon: ["h-8 w-8"],
        "icon-lg": ["h-9 w-9"],
        "icon-xl": [
          "h-10 w-10",
          "[&_svg:not([class*='size-'])]:w-[18px] [&_svg:not([class*='size-'])]:h-[18px]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });

  export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
  export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

  export interface ButtonProps extends HTMLButtonAttributes {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children?: Snippet;
    /** When set, renders as an anchor tag instead of a button. */
    href?: string;
    ref?: HTMLButtonElement | HTMLAnchorElement | null;
  }
</script>

<script lang="ts">
  import { cn } from "$lib/utils";

  let {
    class: className,
    variant = "default",
    size = "default",
    children,
    href,
    ref = $bindable(null),
    ...restProps
  }: ButtonProps = $props();

  // Track pressed state for styling purposes
  let pressed = $state(false);
  function onPointerDown() {
    pressed = true;
  }
  function onPointerUp() {
    pressed = false;
  }
  function onPointerCancel() {
    pressed = false;
  }
  function onBlur() {
    pressed = false;
  }
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === " " || event.key === "Enter") pressed = true;
  }
  function onKeyUp(event: KeyboardEvent) {
    if (event.key === " " || event.key === "Enter") pressed = false;
  }

  const cls = $derived(cn(buttonVariants({ variant, size }), className));
</script>

{#if href}
  <a
    bind:this={ref as HTMLAnchorElement}
    {href}
    class={cls}
    data-slot="button"
    data-pressed={pressed ? "" : undefined}
    onpointerdown={onPointerDown}
    onpointerup={onPointerUp}
    onpointercancel={onPointerCancel}
    onblur={onBlur}
    onkeydown={onKeyDown}
    onkeyup={onKeyUp}
    {...restProps as HTMLAnchorAttributes}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref as HTMLButtonElement}
    class={cls}
    data-slot="button"
    data-pressed={pressed ? "" : undefined}
    onpointerdown={onPointerDown}
    onpointerup={onPointerUp}
    onpointercancel={onPointerCancel}
    onblur={onBlur}
    onkeydown={onKeyDown}
    onkeyup={onKeyUp}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
