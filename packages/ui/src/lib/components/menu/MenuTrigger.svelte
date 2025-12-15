<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import type { MenuContext } from "./types";

    interface Props extends HTMLButtonAttributes {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<MenuContext>("menu");

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            ctx.open = !ctx.open;
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!ctx.open) {
                ctx.open = true;
            }
            const firstEnabled = ctx.items.findIndex((i) => !i.disabled);
            if (firstEnabled !== -1) {
                ctx.setHighlightedIndex(firstEnabled);
            }
        }
    }
</script>

<button
    type="button"
    class={cn(className)}
    onclick={() => (ctx.open = !ctx.open)}
    onkeydown={handleKeyDown}
    aria-haspopup="menu"
    aria-expanded={ctx.open}
    {...restProps}
>
    {@render children?.()}
</button>
