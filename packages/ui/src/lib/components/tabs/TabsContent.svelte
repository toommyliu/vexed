<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { TabsContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        value: string;
    }

    let {
        value,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<TabsContext>("tabs");
</script>

{#if ctx.value === value}
    <div
        role="tabpanel"
        class={cn(
            "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
        )}
        {...restProps}
    >
        {@render children?.()}
    </div>
{/if}
