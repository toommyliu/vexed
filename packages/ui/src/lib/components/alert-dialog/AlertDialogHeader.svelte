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
    class={cn("flex flex-col gap-1 p-5 pb-4", className)}
    data-slot="alert-dialog-header"
    {...restProps}
>
    {@render children?.()}
</div>
