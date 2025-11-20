<script>
    import { cn } from "$lib/util/cn";

    /** @type {string} */
    let className = undefined;
    export { className as class };
</script>

<p
    class={cn("text-muted-foreground text-sm", className)}
    data-slot="dialog-description"
    {...$$restProps}
>
    <slot />
</p>
