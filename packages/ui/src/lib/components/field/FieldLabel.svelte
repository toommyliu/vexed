<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLLabelAttributes } from "svelte/elements";

    interface Props extends HTMLLabelAttributes {
        ref?: HTMLLabelElement;
    }

    let {
        class: className,
        ref = $bindable(),
        children,
        ...props
    }: Props = $props();
</script>

<label
    bind:this={ref}
    class={cn(
        "inline-flex items-center gap-2 text-sm/4 font-medium",
        className,
    )}
    data-slot="field-label"
    {...props}
>
    {@render children?.()}
</label>
