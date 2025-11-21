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

    const ctx: TabsContext = {
        get value() {
            return value;
        },
        set value(v) {
            value = v;
            onValueChange?.(v);
        },
    };

    setContext("tabs", ctx);
</script>

<div class={cn("flex flex-col gap-2", className)} {...restProps}>
    {@render children?.()}
</div>
