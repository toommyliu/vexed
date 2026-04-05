<script lang="ts">
  import { createRadioGroupContext } from "./menu-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface MenuRadioGroupProps extends HTMLAttributes<HTMLDivElement> {
    ref?: HTMLDivElement | null;
    value?: string;
    onValueChange?: (value: string) => void;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    value = $bindable(""),
    onValueChange,
    children,
    ...restProps
  }: MenuRadioGroupProps = $props();

  createRadioGroupContext({
    value: () => value,
    setValue: (v) => {
      value = v;
      onValueChange?.(v);
    },
  });
</script>

<div bind:this={ref} role="group" data-slot="menu-radio-group" {...restProps}>
  {@render children?.()}
</div>
