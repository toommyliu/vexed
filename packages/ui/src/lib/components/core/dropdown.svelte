<script lang="ts">
  import * as Combobox from "$lib/components/core/combobox/index.js";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    value?: any;
    open?: boolean;
    disabled?: boolean;
    placeholder?: string;
    onValueChange?: (value: any) => void;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    value = $bindable(undefined),
    open = $bindable(false),
    disabled = false,
    placeholder = "Select an option",
    onValueChange = undefined,
    onOpenChange = undefined,
    class: className = undefined,
    children,
    ...restProps
  }: Props = $props();
</script>

<Combobox.Root
  bind:value
  bind:open
  {disabled}
  {onValueChange}
  {onOpenChange}
  {...restProps}
>
  <Combobox.Input
    readonly
    {placeholder}
    showTrigger
    class="cursor-pointer caret-transparent"
  />
  <Combobox.Content>
    <Combobox.List>
      {@render children?.()}
    </Combobox.List>
  </Combobox.Content>
</Combobox.Root>
