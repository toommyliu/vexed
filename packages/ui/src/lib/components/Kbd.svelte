<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLElement> {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();
</script>

<kbd
    class={cn(
        "inline-flex h-[22px] min-w-[22px] cursor-default select-none items-center justify-center rounded border border-border/40 bg-muted/50 px-1.5 font-sans text-[11px] font-medium text-foreground transition-all",
        className,
    )}
    data-slot="kbd"
    {...restProps}
>
    {@render children?.()}
</kbd>
