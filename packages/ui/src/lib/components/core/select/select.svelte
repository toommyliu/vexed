<script lang="ts" generics="T">
  import { Select, type SelectRootProps } from "@ark-ui/svelte/select";
  import { createListCollection } from "@ark-ui/svelte/select";
  import { setContext } from "svelte";
  import { cn } from "$lib/utils";
  import type { SelectContext } from "./context";

  let {
    value = $bindable(),
    ref = $bindable(null),
    disabled = false,
    name,
    required = false,
    class: className,
    children,
    multiple = false,
    ...restProps
  }: Omit<SelectRootProps, "collection" | "value"> & {
    value?: T | T[] | null;
  } = $props();

  let items = $state<{ value: T; label: string; disabled: boolean }[]>([]);

  const internalValue = $derived.by(() => {
    const toArray = (v: typeof value): T[] => {
      if (Array.isArray(v)) return v;
      if (v === null || v === undefined) return [];
      return [v as T];
    };
    return toArray(value).map((v) => String(v));
  });

  // Ark UI workaround: we use a context so we can lift state up to the Select.Root without
  // having to pass the collection directly ourselves
  setContext("select", {
    registerItem: (item: { value: T; label: string; disabled: boolean }) => {
      items = [...items, item];
    },
    unregisterItem: (val: T) => {
      items = items.filter((i) => i.value !== val);
    },
    get items() {
      return items;
    },
    get value() {
      return internalValue;
    },
  } as SelectContext<T>);

  const collection = $derived.by(() => {
    return createListCollection({ items });
  });

  function handleValueChange(details: { value: string[] }) {
    const selectedValues = details.value.map((valStr) => {
      const item = items.find((i) => String(i.value) === valStr);
      return item ? item.value : (valStr as any as T);
    });

    if (multiple) {
      value = selectedValues as T[];
    } else {
      value = (selectedValues[0] ?? null) as T;
    }
  }
</script>

<Select.Root
  value={internalValue}
  onValueChange={handleValueChange}
  bind:ref
  {disabled}
  {name}
  {required}
  data-slot="select"
  class={cn("relative block text-left", className)}
  {...restProps}
  {collection}
>
  {@render children?.()}
</Select.Root>
