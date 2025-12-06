<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    interface Props extends HTMLAttributes<HTMLTableSectionElement> {
        children?: Snippet;
    }

    let { class: className, children, ...restProps }: Props = $props();
</script>

<tbody
    class={cn("[&_tr:last-child]:border-0", className)}
    data-slot="table-body"
    {...restProps}
>
    {@render children?.()}
</tbody>
