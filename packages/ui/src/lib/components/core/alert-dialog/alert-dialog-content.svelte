<script lang="ts">
  import {
    DialogContent,
    type DialogContentProps,
    Positioner,
    useDialogContext,
  } from "@ark-ui/svelte/dialog";
  import AlertDialogOverlay from "./alert-dialog-overlay.svelte";
  import { cn } from "$lib/utils";
  import { Portal } from "@ark-ui/svelte/portal";

  let {
    ref = $bindable(null),
    class: className,
    children,
    portalProps,
    ...restProps
  }: DialogContentProps & {
    portalProps?: { target?: string | HTMLElement };
  } = $props();

  const ctx = useDialogContext(undefined);

  const open = $derived.by(() => {
    if (ctx) return ctx?.()?.open;
    return false;
  });
</script>

{#if open}
  <Portal>
    <AlertDialogOverlay />
    <Positioner>
      <DialogContent
        bind:ref
        class={cn(
          "fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98",
          "duration-150 sm:max-w-lg",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.xl)-1px)] before:shadow-[0_1px_0_rgba(0,0,0,0.04)]",
          "dark:before:shadow-[0_-1px_0_rgba(255,255,255,0.08)]",
          className,
        )}
        {...restProps}
      >
        {@render children?.()}
      </DialogContent>
    </Positioner>
  </Portal>
{/if}
