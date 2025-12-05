<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        variant?: "default" | "bare";
    }

    let {
        class: className = undefined,
        variant = "bare",
        children,
        ...restProps
    }: Props = $props();
</script>

<div
    class={cn(
        "flex flex-col-reverse gap-2 px-5 sm:flex-row sm:justify-end",
        variant === "default" && "border-t border-border/50 bg-muted/30 py-4",
        variant === "bare" && "pb-5 pt-2",
        className,
    )}
    data-slot="alert-dialog-footer"
    {...restProps}
>
    {@render children?.()}
</div>
