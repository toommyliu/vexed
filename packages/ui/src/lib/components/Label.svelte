<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLLabelAttributes } from "svelte/elements";

    interface Props extends HTMLLabelAttributes {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();
</script>

<label
    class={cn(
        "inline-flex items-center gap-2 text-sm/4",
        restProps.for && "cursor-pointer",
        className,
    )}
    data-slot="label"
    {...restProps}
>
    {@render children?.()}
</label>
