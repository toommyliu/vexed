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
        "flex flex-col-reverse gap-2 px-6 pb-4 sm:flex-row sm:justify-end sm:border-t sm:bg-muted/50 sm:pt-4",
        className,
    )}
    data-slot="dialog-footer"
    {...restProps}
>
    {@render children?.()}
</div>
