<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";

    interface Props extends HTMLAttributes<HTMLTableSectionElement> {
        children?: Snippet;
    }

    let { class: className, children, ...restProps }: Props = $props();
</script>

<thead
    class={cn("[&_tr]:border-b", className)}
    data-slot="table-header"
    {...restProps}
>
    {@render children?.()}
</thead>
