<script lang="ts">
    import { tv, type VariantProps } from "tailwind-variants";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    const badgeVariants = tv({
        base: "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [button,a&]:cursor-pointer [button,a&]:pointer-coarse:after:absolute [button,a&]:pointer-coarse:after:size-full [button,a&]:pointer-coarse:after:min-h-11 [button,a&]:pointer-coarse:after:min-w-11",
        variants: {
            size: {
                default: "px-[calc(theme(spacing[1])-1px)] text-xs",
                lg: "px-[calc(theme(spacing[1.5])-1px)] text-sm",
                sm: "rounded px-[calc(theme(spacing[1])-1px)] text-[.625rem]",
            },
            variant: {
                default:
                    "bg-primary text-primary-foreground [button,a&]:hover:bg-primary/90",
                destructive:
                    "bg-destructive text-white [button,a&]:hover:bg-destructive/90",
                error: "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
                info: "bg-info/8 text-info-foreground dark:bg-info/16",
                outline:
                    "border-border bg-transparent dark:bg-input/32 [button,a&]:hover:bg-accent/50 dark:[button,a&]:hover:bg-input/48",
                secondary:
                    "bg-secondary text-secondary-foreground [button,a&]:hover:bg-secondary/90",
                success:
                    "bg-success/8 text-success-foreground dark:bg-success/16",
                warning:
                    "bg-warning/8 text-warning-foreground dark:bg-warning/16",
            },
        },
        defaultVariants: {
            size: "default",
            variant: "default",
        },
    });

    type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
    type BadgeSize = VariantProps<typeof badgeVariants>["size"];

    interface Props extends HTMLAttributes<HTMLSpanElement> {
        variant?: BadgeVariant;
        size?: BadgeSize;
    }

    let {
        variant = "default",
        size = "default",
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();
</script>

<span
    class={cn(badgeVariants({ variant, size }), className)}
    data-slot="badge"
    {...restProps}
>
    {@render children?.()}
</span>
