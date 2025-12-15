<script lang="ts">
    import { setContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { TabsContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        value?: string;
        onValueChange?: (value: string | undefined) => void;
    }

    let {
        value = $bindable(),
        onValueChange = undefined,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    let tabs = $state<{ id: string; value: string; disabled: boolean }[]>([]);
    let focusedTabValue = $state<string | undefined>(undefined);

    const ctx: TabsContext = {
        get value() {
            return value;
        },
        set value(v) {
            value = v;
            onValueChange?.(v);
        },
        get tabs() {
            return tabs;
        },
        registerTab(id: string, tabValue: string, disabled: boolean) {
            tabs.push({ id, value: tabValue, disabled });
        },
        unregisterTab(id: string) {
            const index = tabs.findIndex((t) => t.id === id);
            if (index !== -1) {
                tabs.splice(index, 1);
            }
        },
        focusTab(tabValue: string) {
            focusedTabValue = tabValue;
        },
    };

    setContext("tabs", ctx);
</script>

<div class={cn("flex flex-col gap-2", className)} {...restProps}>
    {@render children?.()}
</div>
