<script>
    import { cn } from "$lib/util/cn";

    let { class: className = undefined, children, ...restProps } = $props();
</script>

<div
    class={cn("flex flex-col space-y-1.5 px-6", className)}
    data-slot="card-header"
    {...restProps}
>
    {@render children?.()}
</div>
