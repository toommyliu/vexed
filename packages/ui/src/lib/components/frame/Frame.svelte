<script>
    import { cn } from "$lib/util/cn";

    let { children, class: className = undefined, ...props } = $props();
</script>

<div
    class={cn("relative flex flex-col rounded-2xl bg-muted p-1", className)}
    data-slot="frame"
    {...props}
>
    {@render children?.()}
</div>
