<script>
    import { cn } from "$lib/util/cn";

    let { class: className = undefined, children, ...restProps } = $props();
</script>

<div class={cn("px-6", className)} data-slot="card-content" {...restProps}>
    {@render children?.()}
</div>
