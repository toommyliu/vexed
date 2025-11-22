<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLSpanElement> {
        ref?: HTMLSpanElement;
    }

    let {
        class: className,
        ref = $bindable(),
        children,
        ...props
    }: Props = $props();
</script>

<span
    bind:this={ref}
    class={cn(
        "flex items-center gap-2 text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        className,
    )}
    {...props}
>
    {@render children?.()}
</span>
