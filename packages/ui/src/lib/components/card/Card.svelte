<script>
    import { cn } from "$lib/util/cn";

    let { class: className = undefined, children, ...restProps } = $props();
</script>

<div
    class={cn(
        "relative flex flex-col gap-6 rounded-xl border bg-card text-card-foreground shadow-sm py-6",
        className,
    )}
    data-slot="card"
    {...restProps}
>
    {@render children?.()}
</div>
