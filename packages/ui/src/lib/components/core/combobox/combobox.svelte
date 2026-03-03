<script lang="ts" generics="T extends CollectionItem">
  import {
    Combobox,
    type ComboboxRootProps,
    type CollectionItem,
  } from "@ark-ui/svelte/combobox";
  import { createListCollection } from "@ark-ui/svelte/combobox";
  import { setContext, untrack } from "svelte";

  interface CustomComboboxRootProps extends Omit<
    ComboboxRootProps<T>,
    "collection" | "value" | "onValueChange"
  > {
    value?: string;
    onValueChange?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    open = $bindable(false),
    disabled = false,
    name,
    required = false,
    onValueChange,
    onOpenChange,
    children,
    ...restProps
  }: CustomComboboxRootProps = $props();

  let items = $state<T[]>([]);
  let arkValue = $state<string[]>(value ? [value] : []);

  $effect(() => {
    if (value !== (arkValue[0] || "")) {
      untrack(() => {
        arkValue = value ? [value] : [];
      });
    }
  });

  const handleValueChange = (details: { value: string[] }) => {
    const newVal = details.value[0] || "";
    value = newVal;
    arkValue = details.value;
    onValueChange?.(newVal);
  };

  // Ark UI workaround: we use a context so we can lift state up to the Combobox.Root without
  // having to pass the collection directly ourselves
  setContext("combobox", {
    registerItem: (item: T) => {
      items = [...items, item];
    },
    unregisterItem: (value: string) => {
      items = items.filter((i) => (i as any).value !== value);
    },
  });

  const collection = $derived.by(() => {
    return createListCollection({ items });
  });
</script>

<Combobox.Root
  bind:value={arkValue}
  bind:open
  {disabled}
  {name}
  {required}
  {collection}
  // positioning={{ placement: "bottom-start", offset: { mainAxis: 4 } }}
  onValueChange={handleValueChange}
  {onOpenChange}
  data-slot="combobox"
  {...restProps}
>
  {@render children?.()}
</Combobox.Root>
