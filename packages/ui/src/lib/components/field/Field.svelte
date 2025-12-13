<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        ref?: HTMLDivElement;
    }

    let {
        class: className,
        ref = $bindable(),
        children,
        ...props
    }: Props = $props();
</script>

<div
    bind:this={ref}
    class={cn("flex flex-col items-start gap-2", className)}
    data-slot="field"
    {...props}
>
    {@render children?.()}
</div>
