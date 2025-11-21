<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    interface Props extends HTMLAttributes<HTMLElement> {
        children?: Snippet;
    }

    let { class: className, children, ...restProps }: Props = $props();
</script>

<caption
    class={cn("mt-4 text-sm text-muted-foreground", className)}
    data-slot="table-caption"
    {...restProps}
>
    {@render children?.()}
</caption>
