<script>
    import { cn } from "$lib/util/cn";

    let { class: className = undefined, children, ...restProps } = $props();
</script>

<div
    class={cn("text-sm text-muted-foreground", className)}
    data-slot="card-description"
    {...restProps}
>
    {@render children?.()}
</div>
