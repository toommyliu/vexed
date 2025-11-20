<script>
    import { cn } from "$lib/util/cn";
    let { class: className = undefined, ...restProps } = $props();
</script>

<div class={cn("-mx-1 my-1 h-px bg-muted", className)} {...restProps}></div>
