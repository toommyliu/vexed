<script lang="ts">
    import { tv, type VariantProps } from "tailwind-variants";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    const alertVariants = tv({
        base: "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
        variants: {
            variant: {
                default: "bg-background text-foreground",
                destructive:
                    "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    });

    type AlertVariant = VariantProps<typeof alertVariants>["variant"];

    interface Props extends HTMLAttributes<HTMLDivElement> {
        variant?: AlertVariant;
    }

    let {
        class: className = undefined,
        variant = undefined,
        children,
        ...restProps
    }: Props = $props();
</script>

<div
    role="alert"
    class={cn(alertVariants({ variant }), className)}
    {...restProps}
>
    {@render children?.()}
</div>
