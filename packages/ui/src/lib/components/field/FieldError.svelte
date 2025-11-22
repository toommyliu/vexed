<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLParagraphElement> {
        ref?: HTMLParagraphElement;
    }

    let {
        class: className,
        ref = $bindable(),
        children,
        ...props
    }: Props = $props();
</script>

<p
    bind:this={ref}
    class={cn("text-destructive-foreground text-xs", className)}
    data-slot="field-error"
    {...props}
>
    {@render children?.()}
</p>
