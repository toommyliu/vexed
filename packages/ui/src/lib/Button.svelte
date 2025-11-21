<script lang="ts">
  import { cn } from "$lib/util/cn";
  import { tv, type VariantProps } from "tailwind-variants";
  import type { HTMLButtonAttributes } from "svelte/elements";

  const buttonVariants = tv({
    base: [
      "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2",
      "whitespace-nowrap rounded-lg border bg-clip-padding font-medium text-sm outline-none",
      "transition-shadow",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-[7px]",
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
          "[&:is(:active,[data-pressed])]:shadow-none",
          "[&:is(:disabled,:active,[data-pressed])]:shadow-none",
        ],
        destructive: [
          "border-destructive bg-destructive text-white",
          "shadow-xs shadow-destructive/24",
          "hover:bg-destructive/90",
          "[&:is(:active,[data-pressed])]:shadow-none",
          "[&:is(:disabled,:active,[data-pressed])]:shadow-none",
        ],
        "destructive-outline": [
          "border-border bg-transparent text-destructive-foreground",
          "shadow-xs",
          "dark:bg-input/32 dark:bg-clip-border",
          "[&:is(:disabled,:active,[data-pressed])]:shadow-none",
          "[&:is(:hover,[data-pressed])]:border-destructive/32",
          "[&:is(:hover,[data-pressed])]:bg-destructive/4",
        ],
        success: [
          "border-green-600 bg-green-600 text-white",
          "shadow-xs shadow-green-600/24",
          "hover:bg-green-600/90",
          "[&:is(:active,[data-pressed])]:shadow-none",
          "[&:is(:disabled,:active,[data-pressed])]:shadow-none",
        ],
        outline: [
          "border-border bg-background shadow-xs",
          "dark:bg-input/32 dark:bg-clip-border",
          "[&:is(:disabled,:active,[data-pressed])]:shadow-none",
          "[&:is(:hover,[data-pressed])]:bg-accent/50",
          "dark:[&:is(:hover,[data-pressed])]:bg-input/64",
        ],
        secondary: [
          "border-secondary bg-secondary text-secondary-foreground",
          "hover:bg-secondary/90",
          "data-[pressed]:bg-secondary/90",
        ],
        ghost: [
          "border-transparent",
          "hover:bg-accent",
          "data-[pressed]:bg-accent",
        ],
        link: ["border-transparent", "underline-offset-4 hover:underline"],
      },
      size: {
        xs: [
          "min-h-6 gap-1 rounded-md px-[7px] py-0 text-xs",
          "before:rounded-[5px]",
          "[&_svg:not([class*='size-'])]:w-3 [&_svg:not([class*='size-'])]:h-3",
        ],
        sm: ["min-h-7 gap-1.5 px-[9px] py-0"],
        default: ["min-h-8 px-[11px] py-[5px]"],
        lg: ["min-h-9 px-[13px] py-[7px]"],
        xl: [
          "min-h-10 px-[15px] py-[7px] text-base",
          "[&_svg:not([class*='size-'])]:w-[18px] [&_svg:not([class*='size-'])]:h-[18px]",
        ],
        "icon-xs": ["w-6 h-6 rounded-md", "before:rounded-[5px]"],
        "icon-sm": ["w-7 h-7"],
        icon: ["w-8 h-8"],
        "icon-lg": ["w-9 h-9"],
        "icon-xl": [
          "w-10 h-10",
          "[&_svg:not([class*='size-'])]:w-[18px] [&_svg:not([class*='size-'])]:h-[18px]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });

  type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
  type ButtonSize = VariantProps<typeof buttonVariants>["size"];

  interface Props extends HTMLButtonAttributes {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }

  let {
    class: className = undefined,
    variant = "default",
    size = "default",
    children,
    type = "button",
    ...restProps
  }: Props = $props();
</script>

<button
  class={cn(buttonVariants({ variant, size }), className)}
  data-slot="button"
  {type}
  {...restProps}
>
  {@render children?.()}
</button>
