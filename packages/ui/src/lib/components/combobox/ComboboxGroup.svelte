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
    class={cn("overflow-hidden p-1 text-foreground", className)}
    data-slot="combobox-group"
    {...restProps}
>
    {@render children?.()}
</div>
