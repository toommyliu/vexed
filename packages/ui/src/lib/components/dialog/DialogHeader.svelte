<script>
    import { cn } from "$lib/util/cn";

    /** @type {string} */
    let className = undefined;
    export { className as class };
</script>

<div
    class={cn(
        "flex flex-col gap-1 px-6 pt-6 pb-4 text-center last:pb-6 sm:text-left",
        className,
    )}
    data-slot="dialog-header"
    {...$$restProps}
>
    <slot />
</div>
