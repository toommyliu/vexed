<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLHeadingElement> {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();
</script>

<h2
    class={cn(
        "text-[15px] font-semibold leading-tight tracking-[-0.01em]",
        className,
    )}
    data-slot="alert-dialog-title"
    {...restProps}
>
    {@render children?.()}
</h2>
