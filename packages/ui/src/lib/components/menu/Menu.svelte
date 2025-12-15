<script lang="ts">
    import { setContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { MenuContext } from "./types";

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

    let items = $state<{ id: string; disabled: boolean }[]>([]);
    let highlightedIndex = $state(-1);

    function getNextEnabledIndex(
        currentIndex: number,
        direction: 1 | -1,
    ): number {
        if (items.length === 0) return -1;
        let index = currentIndex;
        for (let i = 0; i < items.length; i++) {
            index = (index + direction + items.length) % items.length;
            if (!items[index].disabled) return index;
        }
        return -1;
    }

    const ctx: MenuContext = {
        get open() {
            return open;
        },
        set open(v) {
            open = v;
            onOpenChange?.(v);
            if (!v) highlightedIndex = -1;
        },
        close() {
            open = false;
            onOpenChange?.(false);
            highlightedIndex = -1;
        },
        get items() {
            return items;
        },
        get highlightedIndex() {
            return highlightedIndex;
        },
        setHighlightedIndex(index: number) {
            highlightedIndex = index;
        },
        registerItem(id: string, disabled: boolean) {
            items.push({ id, disabled });
        },
        unregisterItem(id: string) {
            const index = items.findIndex((i) => i.id === id);
            if (index !== -1) {
                items.splice(index, 1);
            }
        },
        getItemIndex(id: string) {
            return items.findIndex((i) => i.id === id);
        },
        selectHighlighted() {},
    };

    setContext("menu", ctx);
</script>

<div class={cn("relative inline-block text-left", className)} {...restProps}>
    {@render children?.()}
</div>
