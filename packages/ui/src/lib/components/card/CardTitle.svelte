<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();
</script>

<div
    class={cn("font-semibold text-lg leading-none tracking-tight", className)}
    data-slot="card-title"
    {...restProps}
>
    {@render children?.()}
</div>
