<script lang="ts">
  import { cn } from "$lib/utils";
  import { getDialogContext } from "../dialog/dialog-context.js";

  interface AlertDialogOverlayProps {
    ref?: HTMLDivElement | null;
    class?: string;
  }

  let { ref = $bindable(null), class: className }: AlertDialogOverlayProps = $props();

  const ctx = getDialogContext();
  const dataState = $derived(ctx.open() ? "open" : "closed");
</script>

<div
  bind:this={ref}
  data-slot="alert-dialog-overlay"
  data-state={dataState}
  class={cn(
    "fixed inset-0 z-50 bg-black/32 backdrop-blur-[1px] transition-opacity duration-150",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    className,
  )}
></div>
