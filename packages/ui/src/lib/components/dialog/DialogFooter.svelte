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
        "flex flex-col-reverse gap-2 bg-muted/30 px-6 py-4 md:flex-row md:justify-end md:bg-muted/50 [&>button]:w-full [&>button]:md:w-auto",
        className,
    )}
    data-slot="dialog-footer"
    {...restProps}
>
    {@render children?.()}
</div>
