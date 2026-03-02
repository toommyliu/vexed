<script lang="ts">
  import { Title, type DialogTitleProps } from "@ark-ui/svelte/dialog";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: DialogTitleProps = $props();
</script>

<Title
  bind:ref
  class={cn("font-heading font-semibold text-xl leading-none", className)}
  {...restProps}
>
  {@render children?.()}
</Title>
