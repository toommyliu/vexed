<script lang="ts">
    import { getContext, onDestroy, onMount } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import type { TabsContext } from "./types";

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
    const id = Math.random().toString(36).substring(2, 15);

    let buttonElement = $state<HTMLButtonElement>();

    onMount(() => {
        ctx.registerTab(id, value, disabled);
    });

    onDestroy(() => {
        ctx.unregisterTab(id);
    });

    $effect(() => {
        if (ctx.value === value && buttonElement) {
            buttonElement.focus();
        }
    });
</script>

<button
    bind:this={buttonElement}
    type="button"
    role="tab"
    aria-selected={ctx.value === value}
    {disabled}
    class={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm bg-transparent px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground",
        className,
    )}
    data-state={ctx.value === value ? "active" : "inactive"}
    onclick={() => (ctx.value = value)}
    {...restProps}
>
    {@render children?.()}
</button>
