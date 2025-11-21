<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface SelectContext {
        value: any;
        open: boolean;
        disabled: boolean;
        toggle: () => void;
        close: () => void;
    }

    interface Props extends HTMLAttributes<HTMLSpanElement> {
        placeholder?: string;
    }

    let {
        placeholder = "Select...",
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const ctx = getContext<SelectContext>("select");
</script>

<span
    class={cn("flex-1 truncate text-left", className)}
    data-slot="select-value"
    {...restProps}
>
    {#if ctx.value}
        {ctx.value}
    {:else if children}
        {@render children?.()}
    {:else}
        <span class="text-muted-foreground">{placeholder}</span>
    {/if}
</span>
