<script lang="ts">
  import DialogPortal from "$lib/components/core/dialog/dialog-portal.svelte";
  import DialogOverlay from "$lib/components/core/dialog/dialog-overlay.svelte";
  import { getDialogContext } from "$lib/components/core/dialog/dialog-context.js";
  import { focusTrap } from "$lib/actions/focusTrap.js";
  import { scrollLock } from "$lib/actions/scrollLock.js";
  import { dismiss } from "$lib/actions/dismiss.js";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    ref = $bindable(null),
    class: className = undefined,
    children,
  }: {
    ref?: HTMLDivElement | null;
    class?: string;
    children?: Snippet;
  } = $props();

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
      }, 100);
      return () => clearTimeout(t);
    }
  });
</script>

{#if visible}
  <DialogPortal>
    <DialogOverlay />
    <div
      bind:this={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ctx.titleId()}
      aria-describedby={ctx.descriptionId()}
      data-slot="command-dialog-content"
      data-state={dataState}
      use:focusTrap
      use:scrollLock
      use:dismiss={{ onDismiss: () => ctx.close() }}
      class={cn(
        "fixed left-0 right-0 top-[min(8vh,5rem)] z-50 mx-auto w-[calc(100%-2rem)] max-w-xl outline-none",
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.2xl)-1px)] before:shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        "dark:before:shadow-[0_-1px_0_rgba(255,255,255,0.08)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.97]",
        "data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2",
        "data-[state=open]:duration-150 data-[state=closed]:duration-100",
        className,
      )}
    >
      {@render children?.()}
    </div>
  </DialogPortal>
{/if}
