<script>
    import { cn } from "$lib/util/cn";

    /** @type {string} */
    let className = undefined;
    export { className as class };
</script>

<div
    class={cn(
        "flex flex-col-reverse gap-2 px-6 pb-4 sm:flex-row sm:justify-end sm:border-t sm:bg-muted/50 sm:pt-4",
        className,
    )}
    data-slot="dialog-footer"
    {...$$restProps}
>
    <slot />
</div>
