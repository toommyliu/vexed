<script lang="ts">
  import Textarea from "../textarea.svelte";
  import { getInputGroupContext } from "./context.js";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  interface Props extends HTMLTextareaAttributes {
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
      ctx.hasTextarea.value = true;
      ctx.disabled.value = !!restProps.disabled;
      return () => {
        ctx.hasTextarea.value = false;
      };
    }
  });
</script>

<Textarea bind:value {size} class={className} unstyled {...restProps} />
