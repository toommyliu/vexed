<script>
    import { cn } from "$lib/util/cn";

    /** @type {string} */
    let className = undefined;
    export { className as class };
</script>

<h2
    class={cn("font-heading text-xl leading-none", className)}
    data-slot="dialog-title"
    {...$$restProps}
>
    <slot />
</h2>
