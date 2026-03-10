<script lang="ts">
  import Input from "../input.svelte";
  import { getInputGroupContext } from "./context.js";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends Omit<HTMLInputAttributes, "size"> {
    value?: any;
    size?: "sm" | "default" | "lg" | number;
    class?: string;
  }

  let {
    value = $bindable(),
    size = "default",
    class: className = undefined,
    ...restProps
  }: Props = $props();

  const ctx = getInputGroupContext();

  $effect(() => {
    if (ctx) {
      ctx.disabled.value = !!restProps.disabled;
    }
  });
</script>

<Input bind:value {size} class={className} unstyled {...restProps} />
