<script lang="ts">
    import { setContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface MenuContext {
        open: boolean;
        close: () => void;
    }

    interface Props extends HTMLAttributes<HTMLDivElement> {
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    }

    let {
        open = $bindable(false),
        onOpenChange = undefined,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx: MenuContext = {
        get open() {
            return open;
        },
        set open(v) {
            open = v;
            onOpenChange?.(v);
        },
        close() {
            open = false;
            onOpenChange?.(false);
        },
    };

    setContext("menu", ctx);
</script>

<div class={cn("relative inline-block text-left", className)} {...restProps}>
    {@render children?.()}
</div>
