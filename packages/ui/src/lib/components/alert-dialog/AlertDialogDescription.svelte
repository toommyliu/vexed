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
    class={cn("text-[13px] leading-relaxed text-muted-foreground", className)}
    data-slot="alert-dialog-description"
    {...restProps}
>
    {@render children?.()}
</p>
