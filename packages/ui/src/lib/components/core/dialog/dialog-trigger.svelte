<script lang="ts">
  import { Trigger, type DialogTriggerProps } from "@ark-ui/svelte/dialog";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: DialogTriggerProps = $props();
</script>

<Trigger bind:ref class={className} {...restProps}>
  {@render children?.()}
</Trigger>
