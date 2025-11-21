<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {}

    let { class: className = undefined, ...restProps }: Props = $props();
</script>

<div
    class={cn("mx-2 my-1 h-px bg-border", className)}
    data-slot="select-separator"
    {...restProps}
></div>
