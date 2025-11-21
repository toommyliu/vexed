<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    interface Props extends HTMLAttributes<HTMLTableSectionElement> {
        children?: Snippet;
    }

    let { class: className, children, ...restProps }: Props = $props();
</script>

<tfoot
    class={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
    )}
    data-slot="table-footer"
    {...restProps}
>
    {@render children?.()}
</tfoot>
