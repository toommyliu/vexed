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
</script>

<button
    type="button"
    class={cn(className)}
    onclick={() => (ctx.open = !ctx.open)}
    aria-haspopup="true"
    aria-expanded={ctx.open}
    {...restProps}
>
    {@render children?.()}
</button>
