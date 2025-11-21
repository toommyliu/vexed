<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    interface Props extends HTMLAttributes<HTMLTableRowElement> {
        children?: Snippet;
    }

    let { class: className, children, ...restProps }: Props = $props();
</script>

<tr
    class={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
    )}
    data-slot="table-row"
    {...restProps}
>
    {@render children?.()}
</tr>
