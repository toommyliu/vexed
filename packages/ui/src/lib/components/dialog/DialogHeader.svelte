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
        "flex flex-col gap-1 px-6 pt-6 pb-4 text-center last:pb-6 sm:text-left",
        className,
    )}
    data-slot="dialog-header"
    {...restProps}
>
    {@render children?.()}
</div>
