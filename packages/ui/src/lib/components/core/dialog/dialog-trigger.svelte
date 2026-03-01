<script lang="ts">
  import { getDialogContext } from "./dialog-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface DialogTriggerProps extends Omit<HTMLButtonAttributes, "onclick"> {
    ref?: HTMLButtonElement | null;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: DialogTriggerProps = $props();

  const ctx = getDialogContext();
</script>

<button
  bind:this={ref}
  type="button"
  data-slot="dialog-trigger"
  onclick={() => ctx.setOpen(true)}
  {...restProps}
>
  {@render children?.()}
</button>
