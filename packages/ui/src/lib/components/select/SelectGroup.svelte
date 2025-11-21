<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {}

    let {
        children,
        class: className = undefined,
        ...restProps
    }: Props = $props();
</script>

<div role="group" {...restProps}>
    {@render children?.()}
</div>
