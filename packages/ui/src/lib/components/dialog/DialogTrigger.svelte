<script>
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";

    /** @type {string} */
    let className = undefined;
    export { className as class };

    const { updateOpen } = getContext("dialog");

    function handleClick() {
        updateOpen(true);
    }
</script>

<div
    class={cn("inline-flex", className)}
    data-slot="dialog-trigger"
    on:click={handleClick}
    on:keydown={(e) => e.key === "Enter" && handleClick()}
    role="button"
    tabindex="0"
    {...$$restProps}
>
    <slot />
</div>
