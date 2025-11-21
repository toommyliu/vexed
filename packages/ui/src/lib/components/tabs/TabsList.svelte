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
    class={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</div>
