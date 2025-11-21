<script>
    import { cn } from "$lib/util/cn";

    let { children, class: className = undefined, ...props } = $props();
</script>

<div
    class={cn("font-semibold text-sm", className)}
    data-slot="frame-panel-title"
    {...props}
>
    {@render children?.()}
</div>
