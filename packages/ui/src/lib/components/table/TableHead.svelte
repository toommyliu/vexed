<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    interface Props extends HTMLAttributes<HTMLTableCellElement> {
        children?: Snippet;
    }

    let { class: className, children, ...restProps }: Props = $props();
</script>

<th
    class={cn(
        "h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-muted-foreground has-[[role=checkbox]]:pe-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
    )}
    data-slot="table-head"
    {...restProps}
>
    {@render children?.()}
</th>
