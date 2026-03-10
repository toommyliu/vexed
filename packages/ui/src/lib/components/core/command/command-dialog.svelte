<script lang="ts">
  import {
    useDialogContext,
    DialogBackdrop,
    DialogContent,
    Positioner,
  } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";
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

  const ctx = useDialogContext(undefined);
  const open = $derived.by(() => {
    if (ctx) return ctx?.()?.open;
    return false;
  });
</script>

{#if open}
  <Portal>
    <DialogBackdrop
      class="fixed inset-0 z-50 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <Positioner class="fixed inset-0 z-50 flex items-start justify-center">
      <DialogContent
        bind:ref
        data-slot="command-dialog-content"
        class={cn(
          "mt-[min(8vh,5rem)] w-[calc(100%-2rem)] max-w-xl outline-none",
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
      </DialogContent>
    </Positioner>
  </Portal>
{/if}
