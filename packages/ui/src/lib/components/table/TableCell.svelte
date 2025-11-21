<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    interface Props extends HTMLAttributes<HTMLTableCellElement> {
        children?: Snippet;
    }

    let { class: className, children, ...restProps }: Props = $props();
</script>

<td
    class={cn(
        "whitespace-nowrap p-2 align-middle has-[[role=checkbox]]:pe-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
    )}
    data-slot="table-cell"
    {...restProps}
>
    {@render children?.()}
</td>
