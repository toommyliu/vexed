<script lang="ts">
  import type { Snippet } from "svelte";
  import { createDialogContext } from "./dialog-context.js";

  interface DialogRootProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    children,
  }: DialogRootProps = $props();

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
    contentId: () => `dialog-content-${_id}`,
    titleId: () => `dialog-title-${_id}`,
    descriptionId: () => `dialog-desc-${_id}`,
  });
</script>

{@render children?.()}
