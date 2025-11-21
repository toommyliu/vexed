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
    class={cn("flex items-center px-6 pt-0", className)}
    data-slot="card-footer"
    {...restProps}
>
    {@render children?.()}
</div>
