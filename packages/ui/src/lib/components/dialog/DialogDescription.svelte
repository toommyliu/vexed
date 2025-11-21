<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLParagraphElement> {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();
</script>

<p
    class={cn("text-muted-foreground text-sm", className)}
    data-slot="dialog-description"
    {...restProps}
>
    {@render children?.()}
</p>
