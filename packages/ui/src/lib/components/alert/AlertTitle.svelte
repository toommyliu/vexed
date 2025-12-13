<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLHeadingElement> {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();
</script>

<h5
    class={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...restProps}
>
    {@render children?.()}
</h5>
