<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLParagraphElement> {}

    let {
        children,
        class: className = undefined,
        ...restProps
    }: Props = $props();
</script>

<p class={cn("text-sm text-muted-foreground", className)} {...restProps}>
    {@render children?.()}
</p>
