<script>
    import { cn } from "$lib/util/cn";

    let { class: className = undefined, children, ...restProps } = $props();
</script>

<div
    class={cn("flex items-center px-6 pt-0", className)}
    data-slot="card-footer"
    {...restProps}
>
    {@render children?.()}
</div>
