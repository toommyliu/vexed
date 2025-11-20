<script>
    import { cn } from "$lib/util/cn";

    /** @type {string} */
    let className = undefined;
    export { className as class };
</script>

<label
    class={cn("inline-flex items-center gap-2 text-sm/4", className)}
    data-slot="label"
    {...$$restProps}
>
    <slot />
</label>
