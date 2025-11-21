<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLButtonAttributes } from "svelte/elements";

    interface TabsContext {
        value: string | undefined;
    }

    interface Props extends HTMLButtonAttributes {
        value: string;
        disabled?: boolean;
    }

    let {
        value,
        class: className = undefined,
        children,
        disabled = false,
        ...restProps
    }: Props = $props();

    const ctx = getContext<TabsContext>("tabs");
</script>

<button
    type="button"
    role="tab"
    aria-selected={ctx.value === value}
    {disabled}
    class={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className,
    )}
    data-state={ctx.value === value ? "active" : "inactive"}
    onclick={() => (ctx.value = value)}
    {...restProps}
>
    {@render children?.()}
</button>
