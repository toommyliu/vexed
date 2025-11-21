<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {}

    let {
        children,
        class: className = undefined,
        ...restProps
    }: Props = $props();
</script>

<div
    class={cn(
        "flex flex-col items-center justify-center gap-4 p-8 text-center",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</div>
