<script lang="ts">
  import type { Snippet } from "svelte";
  import { createDialogContext } from "../dialog/dialog-context.js";

  interface AlertDialogRootProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    children,
  }: AlertDialogRootProps = $props();

  const _id = Math.random().toString(36).slice(2, 10);

  createDialogContext({
    open: () => open,
    setOpen: (v: boolean) => {
      open = v;
      onOpenChange?.(v);
    },
    close: () => {
      open = false;
      onOpenChange?.(false);
    },
    contentId: () => `alert-dialog-content-${_id}`,
    titleId: () => `alert-dialog-title-${_id}`,
    descriptionId: () => `alert-dialog-desc-${_id}`,
  });
</script>

{@render children?.()}
