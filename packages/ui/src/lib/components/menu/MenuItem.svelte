<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import type { MenuContext } from "./types";

    interface Props extends HTMLButtonAttributes {
        disabled?: boolean;
    }

    let {
        class: className = undefined,
        children,
        disabled = false,
        ...restProps
    }: Props = $props();

    const ctx = getContext<MenuContext>("menu");

    function handleClick(e: MouseEvent) {
        if (disabled) {
            e.preventDefault();
            return;
        }
        ctx.close();
        // @ts-ignore - event type mismatch
        restProps.onclick?.(e);
    }
</script>

<button
    type="button"
    class={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
        className,
    )}
    {disabled}
    data-disabled={disabled ? "" : undefined}
    onclick={handleClick}
    {...restProps}
>
    {@render children?.()}
</button>
