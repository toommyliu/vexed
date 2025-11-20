<script lang="ts">
  import { tv, type VariantProps } from "tailwind-variants";
  import { cn } from "./util/cn";
  import type { HTMLButtonAttributes } from "svelte/elements";

  const buttonVariants = tv({
    base: "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border bg-clip-padding font-medium text-sm outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme('borderRadius.lg')-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    variants: {
      variant: {
        default:
          "not-disabled:shadow-[inset_0_1px_rgba(255,255,255,0.16)] border-primary bg-primary text-primary-foreground shadow-primary/25 shadow-sm hover:bg-primary/90 [&:is(:active,[data-pressed])]:shadow-[inset_0_1px_rgba(0,0,0,0.08)] [&:is(:disabled,:active,[data-pressed])]:shadow-none",
        destructive:
          "not-disabled:shadow-[inset_0_1px_rgba(255,255,255,0.16)] border-destructive bg-destructive text-white shadow-destructive/25 shadow-sm hover:bg-destructive/90 [&:is(:active,[data-pressed])]:shadow-[inset_0_1px_rgba(0,0,0,0.08)] [&:is(:disabled,:active,[data-pressed])]:shadow-none",
        "destructive-outline":
          "border-border bg-transparent text-destructive-foreground shadow-sm not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_rgba(0,0,0,0.04)] dark:bg-input/30 dark:not-disabled:before:shadow-[0_-1px_rgba(255,255,255,0.04)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_rgba(255,255,255,0.08)] [&:is(:disabled,:active,[data-pressed])]:shadow-none [&:is(:hover,[data-pressed])]:border-destructive/30 [&:is(:hover,[data-pressed])]:bg-destructive/5",
        ghost: "border-transparent hover:bg-accent data-pressed:bg-accent",
        link: "border-transparent underline-offset-4 hover:underline",
        outline:
          "border-border bg-background shadow-sm not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_rgba(0,0,0,0.04)] dark:bg-input/30 dark:not-disabled:before:shadow-[0_-1px_rgba(255,255,255,0.04)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_rgba(255,255,255,0.08)] [&:is(:disabled,:active,[data-pressed])]:shadow-none [&:is(:hover,[data-pressed])]:bg-accent/50 dark:[&:is(:hover,[data-pressed])]:bg-input/60",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/90 data-pressed:bg-secondary/90",
      },
      size: {
        default:
          "min-h-8 px-[calc(theme('spacing.3')-1px)] py-[calc(theme('spacing.1.5')-1px)]",
        sm: "min-h-7 gap-1.5 px-[calc(theme('spacing.2.5')-1px)] py-[calc(theme('spacing.1')-1px)]",
        lg: "min-h-9 px-[calc(theme('spacing.3.5')-1px)] py-[calc(theme('spacing.2')-1px)]",
        icon: "size-8",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
        "icon-xl": "size-10 [&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs":
          "size-6 rounded-md before:rounded-[calc(theme('borderRadius.md')-1px)]",
        xl: "min-h-10 px-[calc(theme('spacing.4')-1px)] py-[calc(theme('spacing.2')-1px)] text-base [&_svg:not([class*='size-'])]:size-4.5",
        xs: "min-h-6 gap-1 rounded-md px-[calc(theme('spacing.2')-1px)] py-[calc(theme('spacing.1')-1px)] text-xs before:rounded-[calc(theme('borderRadius.md')-1px)] [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });

  type ButtonProps = HTMLButtonAttributes &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    };

  let {
    class: className,
    variant,
    size,
    children,
    ...rest
  }: ButtonProps = $props();
</script>

<button
  class={cn(buttonVariants({ variant, size }), className)}
  data-slot="button"
  {...rest}
>
  {@render children?.()}
</button>
