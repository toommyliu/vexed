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
    class={cn("flex flex-col space-y-1.5 px-6", className)}
    data-slot="card-header"
    {...restProps}
>
    {@render children?.()}
</div>
