<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { DialogContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const { updateOpen } = getContext<DialogContext>("dialog");

    function handleClick() {
        updateOpen(false);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            handleClick();
        }
    }
</script>

<div
    class={cn("inline-flex", className)}
    data-slot="dialog-close"
    onclick={handleClick}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
    {...restProps}
>
    {@render children?.()}
</div>
