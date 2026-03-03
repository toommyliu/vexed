<script lang="ts">
  import * as Combobox from "$lib/components/core/combobox/index.js";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "value" | "id"> {
    value?: string;
    id?: string;
    open?: boolean;
    disabled?: boolean;
    placeholder?: string;
    onValueChange?: (value: string) => void;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    value = $bindable(""),
    id,
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
  openOnClick={true}
  onOpenChange={(details) => onOpenChange?.(details.open)}
  {...restProps}
>
  <Combobox.Input
    readonly
    {placeholder}
    showTrigger
    class="cursor-pointer caret-transparent"
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (!open) {
          e.preventDefault();
          open = true;
        } else if (e.key === " ") {
          // Prevent scroll when open, as this is a dropdown and Space should select
          e.preventDefault();
          // Find the currently highlighted item and click it to select
          const item = document.querySelector(
            '[data-highlighted][data-slot="combobox-item"]',
          );
          if (item instanceof HTMLElement) item.click();
        }
      }
    }}
  />

  <Combobox.Content>
    <Combobox.List>
      {@render children?.()}
    </Combobox.List>
  </Combobox.Content>
</Combobox.Root>
