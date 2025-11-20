<script>
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";

    let {
        class: className = undefined,
        placeholder = "Select...",
        ...restProps
    } = $props();
    const ctx = getContext("select");
</script>

<span class={cn("block truncate", className)} {...restProps}>
    {#if ctx.value}
        {ctx.value}
    {:else}
        <span class="text-muted-foreground">{placeholder}</span>
    {/if}
</span>
