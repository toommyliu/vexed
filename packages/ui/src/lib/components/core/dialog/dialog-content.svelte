<script lang="ts">
  import type { Snippet } from "svelte";
  import DialogPortal from "./dialog-portal.svelte";
  import DialogOverlay from "./dialog-overlay.svelte";
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import { getDialogContext } from "./dialog-context.js";
  import { focusTrap } from "$lib/actions/focusTrap.js";
  import { scrollLock } from "$lib/actions/scrollLock.js";
  import { dismiss } from "$lib/actions/dismiss.js";

  interface DialogContentProps {
    ref?: HTMLDivElement | null;
    class?: string;
    showCloseButton?: boolean;
    children?: Snippet;
    portalProps?: { target?: string | HTMLElement };
  }

  let {
    ref = $bindable(null),
    class: className,
    showCloseButton = true,
    portalProps,
    children,
  }: DialogContentProps = $props();

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
  <DialogPortal {...portalProps}>
    <DialogOverlay />
    <div
      bind:this={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ctx.titleId()}
      aria-describedby={ctx.descriptionId()}
      data-slot="dialog-content"
      data-state={dataState}
      use:focusTrap
      use:scrollLock
      use:dismiss={{ onDismiss: () => ctx.close() }}
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
      {#if showCloseButton}
        <button
          type="button"
          data-slot="dialog-close-button"
          onclick={() => ctx.close()}
          class="absolute end-2 top-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent text-foreground opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          aria-label="Close"
        >
          <Icon icon="x" />
        </button>
      {/if}
    </div>
  </DialogPortal>
{/if}
