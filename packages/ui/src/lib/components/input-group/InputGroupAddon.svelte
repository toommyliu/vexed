<script lang="ts">
    import { cn } from "$lib/util/cn";
    import { tv, type VariantProps } from "tailwind-variants";
    import type { HTMLAttributes } from "svelte/elements";

    const inputGroupAddonVariants = tv({
        base: "flex h-auto cursor-text select-none items-center justify-center gap-2 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4 not-has-[button]:**:[svg]:opacity-72",
        variants: {
            align: {
                "block-end":
                    "order-last w-full justify-start px-[calc(theme(spacing.3)-1px)] pb-[calc(theme(spacing.3)-1px)] [.border-t]:pt-[calc(theme(spacing.3)-1px)] [[data-size=sm]+&]:px-[calc(theme(spacing[2.5])-1px)]",
                "block-start":
                    "order-first w-full justify-start px-[calc(theme(spacing.3)-1px)] pt-[calc(theme(spacing.3)-1px)] [.border-b]:pb-[calc(theme(spacing.3)-1px)] [[data-size=sm]+&]:px-[calc(theme(spacing[2.5])-1px)]",
                "inline-end":
                    "has-[>[data-slot=badge]]:-me-1.5 has-[>button]:-me-2 order-last pe-[calc(theme(spacing.3)-1px)] has-[>kbd]:me-[-0.35rem] [[data-size=sm]+&]:pe-[calc(theme(spacing[2.5])-1px)]",
                "inline-start":
                    "has-[>[data-slot=badge]]:-ms-1.5 has-[>button]:-ms-2 order-first ps-[calc(theme(spacing.3)-1px)] has-[>kbd]:ms-[-0.35rem] [[data-size=sm]+&]:ps-[calc(theme(spacing[2.5])-1px)]",
            },
        },
        defaultVariants: {
            align: "inline-start",
        },
    });

    type Align = VariantProps<typeof inputGroupAddonVariants>["align"];

    interface Props extends HTMLAttributes<HTMLDivElement> {
        align?: Align;
        ref?: HTMLDivElement;
    }

    let {
        class: className,
        align = "inline-start",
        ref = $bindable(),
        children,
        ...props
    }: Props = $props();

    function handleMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest("button, a");
        if (isInteractive) return;
        e.preventDefault();

        const currentTarget = e.currentTarget as HTMLElement;
        const parent = currentTarget.parentElement;
        const input = parent?.querySelector<
            HTMLInputElement | HTMLTextAreaElement
        >("input, textarea");
        if (input && !parent?.querySelector("input:focus, textarea:focus")) {
            input.focus();
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    bind:this={ref}
    class={cn(inputGroupAddonVariants({ align }), className)}
    data-align={align}
    data-slot="input-group-addon"
    onmousedown={handleMouseDown}
    {...props}
>
    {@render children?.()}
</div>
