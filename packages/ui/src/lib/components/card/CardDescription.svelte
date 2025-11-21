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
    class={cn("text-sm text-muted-foreground", className)}
    data-slot="card-description"
    {...restProps}
>
    {@render children?.()}
</div>
