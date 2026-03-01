<script lang="ts">
  import { getDialogContext } from "./dialog-context.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface DialogCloseProps extends Omit<HTMLButtonAttributes, "onclick"> {
    ref?: HTMLButtonElement | null;
    children?: Snippet;
  }

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: DialogCloseProps = $props();

  const ctx = getDialogContext();
</script>

<button
  bind:this={ref}
  type="button"
  data-slot="dialog-close"
  onclick={() => ctx.close()}
  {...restProps}
>
  {@render children?.()}
</button>
