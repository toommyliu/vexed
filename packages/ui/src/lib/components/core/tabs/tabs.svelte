<script lang="ts">
  import { TabsRoot, type TabsRootProps } from "@ark-ui/svelte/tabs";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    ref = $bindable(null),
    value = $bindable(""),
    orientation = "horizontal",
    class: className,
    children,
    onValueChange,
    ...restProps
  }: TabsRootProps = $props();
</script>

<TabsRoot
  bind:ref
  bind:value
  {orientation}
  class={cn(
    "flex gap-2 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex-row data-[orientation=vertical]:items-start",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</TabsRoot>
