<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        variant?: "default" | "icon";
    }

    let {
        children = undefined,
        class: className = undefined,
        variant = "default",
        ...restProps
    }: Props = $props();
</script>

<div
    class={cn(
        "flex items-center justify-center",
        variant === "icon" &&
            "h-12 w-12 rounded-full bg-muted text-muted-foreground [&>svg]:h-6 [&>svg]:w-6",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</div>
