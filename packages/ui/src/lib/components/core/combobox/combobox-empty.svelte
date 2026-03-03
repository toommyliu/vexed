<script lang="ts">
  import {
    ComboboxEmpty,
    type ComboboxEmptyProps,
  } from "@ark-ui/svelte/combobox";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
    ...restProps
  }: ComboboxEmptyProps = $props();
</script>

<ComboboxEmpty
  bind:ref
  data-slot="combobox-empty"
  class={cn("py-6 text-center text-sm text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</ComboboxEmpty>
