<script>
    import { cn } from "$lib/util/cn";

    let { children, class: className = undefined, ...props } = $props();
</script>

<header
    class={cn("flex flex-col px-5 py-4", className)}
    data-slot="frame-panel-header"
    {...props}
>
    {@render children?.()}
</header>
