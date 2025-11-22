<script>
    import { cn } from "$lib/util/cn";

    let { children, class: className = undefined, ...props } = $props();
</script>

<div
    class={cn("text-muted-foreground text-sm", className)}
    data-slot="frame-panel-description"
    {...props}
>
    {@render children?.()}
</div>
