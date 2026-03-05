<script lang="ts" generics="T">
  import { cn } from "$lib/utils";
  import { Select, type SelectValueTextProps } from "@ark-ui/svelte/select";
  import { getContext } from "svelte";
  import type { SelectContext } from "./context";

  let {
    placeholder = "Select...",
    class: className = undefined,
    children,
    ...restProps
  }: SelectValueTextProps = $props();

  const selectContext = getContext<SelectContext<T>>("select");

  const displayValue = $derived.by(() => {
    if (!selectContext) return null;
    const items = selectContext.items ?? [];
    const values = selectContext.value ?? [];

    if (values.length === 0) return null;

    const selectedLabels = values
      .map((valStr: string) => {
        const found = items.find((i) => String(i.value) === valStr);
        return found ? found.label : null;
      })
      .filter(Boolean);

    if (selectedLabels.length > 0) return selectedLabels.join(", ");
    return null;
  });
</script>

<Select.ValueText
  data-slot="select-value"
  class={cn(
    "flex-1 min-w-0 truncate text-left",
    !displayValue && "text-muted-foreground",
    className,
  )}
  data-placeholder={displayValue ? undefined : ""}
  {...restProps}
>
  {displayValue || placeholder}
</Select.ValueText>
