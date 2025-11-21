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
        "px-2 py-1.5 text-xs font-medium text-muted-foreground",
        className,
    )}
    data-slot="combobox-group-label"
    {...restProps}
>
    {@render children?.()}
</div>
