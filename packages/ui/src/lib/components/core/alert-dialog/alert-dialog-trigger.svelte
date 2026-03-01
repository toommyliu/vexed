<script lang="ts">
  import { getDialogContext } from "../dialog/dialog-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface AlertDialogTriggerProps extends Omit<HTMLButtonAttributes, "onclick"> {
    ref?: HTMLButtonElement | null;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: AlertDialogTriggerProps = $props();

  const ctx = getDialogContext();
</script>

<button
  bind:this={ref}
  type="button"
  data-slot="alert-dialog-trigger"
  onclick={() => ctx.setOpen(true)}
  {...restProps}
>
  {@render children?.()}
</button>
