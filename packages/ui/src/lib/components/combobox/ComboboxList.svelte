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
        "max-h-[min(var(--available-height),23rem)] w-[var(--anchor-width)] overflow-y-auto p-1",
        className,
    )}
    data-slot="combobox-list"
    {...restProps}
>
    {@render children?.()}
</div>
