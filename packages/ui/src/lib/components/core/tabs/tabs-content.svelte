<script lang="ts">
  import { TabContent, type TabContentProps } from "@ark-ui/svelte/tabs";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    value,
    class: className,
    children,
    ...restProps
  }: TabContentProps = $props();
</script>

<TabContent
  bind:ref
  {value}
  data-slot="tabs-content"
  class={cn("flex-1 outline-none", className)}
  {...restProps}
>
  {@render children?.()}
</TabContent>
