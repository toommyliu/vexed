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
          "border-border bg-transparent text-destructive",
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
        "icon-button": [
          "border-border bg-background text-foreground shadow-xs",
          "hover:border-primary/40 hover:bg-accent hover:shadow-sm",
          "data-[pressed]:bg-accent/90 data-[pressed]:border-primary/30",
          "[&_svg]:text-foreground",
          "dark:bg-card dark:border-border/80",
          "dark:hover:bg-accent dark:hover:border-primary/40",
        ],
      },
      size: {
        xs: [
          "h-6 gap-1 rounded-md px-[7px] text-xs",
          "before:rounded-[5px]",
          "[&_svg:not([class*='size-'])]:w-3 [&_svg:not([class*='size-'])]:h-3",
        ],
        sm: ["h-7 gap-1.5 px-[9px]"],
        default: ["h-8 px-[11px]"],
        lg: ["h-9 px-[13px]"],
        xl: [
          "h-10 px-[15px] text-base",
          "[&_svg:not([class*='size-'])]:w-[18px] [&_svg:not([class*='size-'])]:h-[18px]",
        ],
        "icon-xs": ["h-6 w-6 rounded-md", "before:rounded-[5px]"],
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
