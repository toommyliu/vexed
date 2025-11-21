<script lang="ts">
    import { setContext } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    interface SelectContext {
        value: any;
        open: boolean;
        disabled: boolean;
        toggle: () => void;
        close: () => void;
        anchorWidth: number;
        setAnchorWidth: (width: number) => void;
    }

    interface Props extends HTMLAttributes<HTMLDivElement> {
        value?: any;
        onValueChange?: (value: any) => void;
        open?: boolean;
        disabled?: boolean;
        name?: string;
        required?: boolean;
    }

    let {
        value = $bindable(undefined),
        onValueChange = undefined,
        open = $bindable(false),
        disabled = false,
        name = undefined,
        required = false,
        children,
        class: className = undefined,
        ...restProps
    }: Props = $props();

    let anchorWidth = $state(0);

    const ctx: SelectContext = {
        get value() {
            return value;
        },
        set value(v) {
            value = v;
            if (onValueChange) onValueChange(v);
        },
        get open() {
            return open;
        },
        set open(v) {
            open = v;
        },
        get disabled() {
            return disabled;
        },
        get anchorWidth() {
            return anchorWidth;
        },
        setAnchorWidth(width: number) {
            anchorWidth = width;
        },
        toggle() {
            if (!disabled) open = !open;
        },
        close() {
            open = false;
        },
    };

    setContext("select", ctx);
</script>

<div
    class={className || "relative inline-block text-left w-full"}
    style="--anchor-width: {anchorWidth}px"
    {...restProps}
>
    {@render children?.()}
    {#if name}
        <input type="hidden" {name} {value} {required} />
    {/if}
</div>
