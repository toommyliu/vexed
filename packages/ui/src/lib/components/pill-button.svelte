<script lang="ts">
  import { Button } from "$lib";
  import type { ButtonProps } from "$lib/components/core/button.svelte";
  import { cn } from "$lib/utils";

  let {
    class: className,
    variant = "default",
    size = "default",
    children,
    ...restProps
  }: ButtonProps = $props();
</script>

<Button {variant} {size} class={cn("rounded-full", className)} style="--button-radius: 9999px" {...restProps}>
  {@render children?.()}
</Button>
