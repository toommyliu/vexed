<script lang="ts">
  import type { Snippet } from "svelte";
  import AlertDialogPortal from "./alert-dialog-portal.svelte";
  import AlertDialogOverlay from "./alert-dialog-overlay.svelte";
  import { cn } from "$lib/utils";
  import { getDialogContext } from "../dialog/dialog-context.js";
  import { focusTrap } from "$lib/actions/focusTrap.js";
  import { scrollLock } from "$lib/actions/scrollLock.js";
  import { dismiss } from "$lib/actions/dismiss.js";

  interface AlertDialogContentProps {
    ref?: HTMLDivElement | null;
    class?: string;
    children?: Snippet;
    portalProps?: { target?: string | HTMLElement };
  }

  let {
    ref = $bindable(null),
    class: className,
    portalProps,
    children,
  }: AlertDialogContentProps = $props();

  const ctx = getDialogContext();

  let open = $derived(ctx.open());
  let closing = $state(false);
  let visible = $derived(open || closing);
  const dataState = $derived(open ? "open" : "closed");

  let prevOpen = $state(false);
  $effect(() => {
    prevOpen = ctx.open();
  });
  $effect(() => {
    const cur = ctx.open();
    if (prevOpen && !cur) {
      closing = true;
      const t = setTimeout(() => {
        closing = false;
      }, 160);
      return () => clearTimeout(t);
    }
  });
</script>

{#if visible}
  <AlertDialogPortal {...portalProps}>
    <AlertDialogOverlay />
    <div
      bind:this={ref}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={ctx.titleId()}
      aria-describedby={ctx.descriptionId()}
      data-slot="alert-dialog-content"
      data-state={dataState}
      use:focusTrap
      use:scrollLock
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
    >
      {@render children?.()}
    </div>
  </AlertDialogPortal>
{/if}
