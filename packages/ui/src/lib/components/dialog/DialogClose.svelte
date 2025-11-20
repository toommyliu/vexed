<script>
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";

    /** @type {string} */
    let className = undefined;
    export { className as class };

    const { updateOpen } = getContext("dialog");

    function handleClick() {
        updateOpen(false);
    }
</script>

<div
    class={cn("inline-flex", className)}
    data-slot="dialog-close"
    on:click={handleClick}
    on:keydown={(e) => e.key === "Enter" && handleClick()}
    role="button"
    tabindex="0"
    {...$$restProps}
>
    <slot />
</div>
