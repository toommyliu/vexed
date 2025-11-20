<script>
    import { cn } from "$lib/util/cn";

    let { class: className = undefined, children, ...restProps } = $props();
</script>

<div
    class={cn("font-semibold text-lg leading-none tracking-tight", className)}
    data-slot="card-title"
    {...restProps}
>
    {@render children?.()}
</div>
