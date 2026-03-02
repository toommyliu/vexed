<script lang="ts">
  import {
    DialogContent,
    DialogCloseTrigger,
    type DialogContentProps,
    DialogBackdrop,
    Positioner,
    useDialogContext,
  } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";

  import { cn } from "$lib/utils";
  import { Icon } from "$lib";

  let {
    ref = $bindable(null),
    class: className,
    showCloseButton = true,
    children,
    ...restProps
  }: DialogContentProps & {
    showCloseButton?: boolean;
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
      class="fixed inset-0 z-50 backdrop-blur-[1px] data-[state=open]:animate-in fade-in"
    />
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
        {#if showCloseButton}
          <DialogCloseTrigger
            class="absolute end-2 top-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent text-foreground opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <Icon icon="x" />
          </DialogCloseTrigger>
        {/if}
      </DialogContent>
    </Positioner>
  </Portal>
{/if}
