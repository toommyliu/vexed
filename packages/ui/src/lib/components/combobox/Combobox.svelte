<script lang="ts">
    import { setContext } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";
    import type { ComboboxContext } from "./types";
    import { cn } from "$lib/util/cn";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        value?: any;
        inputValue?: string;
        open?: boolean;
        disabled?: boolean;
        onValueChange?: (value: any) => void;
        onInputValueChange?: (value: string) => void;
        onOpenChange?: (open: boolean) => void;
    }

    let {
        value = $bindable(undefined),
        inputValue = $bindable(""),
        open = $bindable(false),
        disabled = false,
        onValueChange = undefined,
        onInputValueChange = undefined,
        onOpenChange = undefined,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    let items = $state<{ id: string; value: any }[]>([]);
    let highlightedIndex = $state(-1);
    let anchorWidth = $state(0);

    const ctx: ComboboxContext = {
        get value() {
            return value;
        },
        get inputValue() {
            return inputValue;
        },
        get open() {
            return open;
        },
        get disabled() {
            return disabled;
        },
        get highlightedIndex() {
            return highlightedIndex;
        },
        get items() {
            return items;
        },
        toggle() {
            if (!disabled) {
                open = !open;
                if (onOpenChange) onOpenChange(open);
            }
        },
        close() {
            open = false;
            if (onOpenChange) onOpenChange(false);
        },
        setOpen(v) {
            open = v;
            if (onOpenChange) onOpenChange(v);
        },
        setValue(v) {
            value = v;
            if (onValueChange) onValueChange(v);
        },
        setInputValue(v) {
            inputValue = v;
            if (onInputValueChange) onInputValueChange(v);
        },
        setHighlightedIndex(index) {
            highlightedIndex = index;
        },
        registerItem(id, itemValue) {
            items.push({ id, value: itemValue });
        },
        unregisterItem(id) {
            const index = items.findIndex((i) => i.id === id);
            if (index !== -1) {
                items.splice(index, 1);
            }
        },
        getItemIndex(id) {
            return items.findIndex((i) => i.id === id);
        },
    };

    setContext("combobox", ctx);
</script>

<div
    class={cn("relative w-full", className)}
    bind:clientWidth={anchorWidth}
    style="--anchor-width: {anchorWidth}px"
    {...restProps}
>
    {@render children?.()}
</div>
