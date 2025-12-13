<script>
    import { cn } from "$lib/util/cn";

    let { children, class: className = undefined, ...props } = $props();
</script>

<div
    class={cn(
        "relative not-has-[table]:rounded-xl not-has-[table]:border not-has-[table]:bg-card bg-clip-padding not-has-[table]:p-5 not-has-[table]:shadow-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-xl)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] has-[table]:before:hidden dark:bg-clip-border dark:before:shadow-[0_-1px_--theme(--color-white/8%)]",
        className,
    )}
    data-slot="frame-panel"
    {...props}
>
    {@render children?.()}
</div>
