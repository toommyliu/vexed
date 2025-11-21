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

<h2
    class={cn("font-heading text-xl leading-none", className)}
    data-slot="dialog-title"
    {...restProps}
>
    {@render children?.()}
</h2>
