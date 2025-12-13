<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLHeadingElement> {}

    let {
        children,
        class: className = undefined,
        ...restProps
    }: Props = $props();
</script>

<h3
    class={cn("text-lg font-semibold text-foreground", className)}
    {...restProps}
>
    {@render children?.()}
</h3>
