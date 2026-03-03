<script lang="ts">
  import { Select, type SelectRootProps } from "@ark-ui/svelte/select";
  import { createListCollection } from "@ark-ui/svelte/select";
  import { setContext } from "svelte";
  import { cn } from "$lib/utils";

  let {
    value = $bindable([]),
    ref = $bindable(null),
    disabled = false,
    name,
    required = false,
    class: className,
    children,
    multiple = false,
    ...restProps
  }: Omit<SelectRootProps, "collection"> = $props();

  let items = $state<any[]>([]);

  // Ark UI workaround: we use a context so we can lift state up to the Select.Root without
  // having to pass the collection directly ourselves
  setContext("select", {
    registerItem: (item: any) => {
      items = [...items, item];
    },
    unregisterItem: (value: string) => {
      items = items.filter((i) => i.value !== value);
    },
  });

  const collection = $derived.by(() => {
    return createListCollection({ items });
  });
</script>

<Select.Root
  bind:value
  bind:ref
  {disabled}
  {name}
  {required}
  // lazyMount={false}
  // unmountOnExit={false}
  data-slot="select"
  class={cn("relative block text-left", className)}
  {...restProps}
  {collection}
>
  {@render children?.()}
</Select.Root>
