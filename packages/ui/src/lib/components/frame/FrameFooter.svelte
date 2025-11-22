<script>
    import { cn } from "$lib/util/cn";

    let { children, class: className = undefined, ...props } = $props();
</script>

<footer
    class={cn("flex flex-col gap-1 px-5 py-4", className)}
    data-slot="frame-panel-footer"
    {...props}
>
    {@render children?.()}
</footer>
