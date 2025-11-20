<script>
    let { children, ...restProps } = $props();
</script>

<div role="group" {...restProps}>
    {@render children?.()}
</div>
