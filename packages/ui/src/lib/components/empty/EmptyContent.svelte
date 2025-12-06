<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {}

    let {
        children = undefined,
        class: className = undefined,
        ...restProps
    }: Props = $props();
</script>

<div
    class={cn("flex items-center justify-center gap-2", className)}
    {...restProps}
>
    {@render children?.()}
</div>
