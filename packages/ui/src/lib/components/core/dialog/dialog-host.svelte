<script lang="ts">
  import * as Dialog from "$lib/components/core/dialog/index.js";
  import * as AlertDialog from "$lib/components/core/alert-dialog/index.js";
  import { dialog, dialogs } from "$lib/components/core/dialog/dialog-store";
  import { cn } from "$lib/utils";

  function handleOpenChange(id: string, open: boolean) {
    if (!open) dialog.close(id, false);
  }

  const dialogSizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
    full: "sm:max-w-[calc(100%-4rem)]",
  } as const;

  function getContentClass(
    size: keyof typeof dialogSizeClasses | undefined,
    extra?: string,
  ) {
    return cn(size ? dialogSizeClasses[size] : undefined, extra);
  }
</script>

{#each $dialogs as item (item.id)}
  {#if item.type === "alert"}
    <AlertDialog.Root
      open={item.open}
      onOpenChange={(open) => handleOpenChange(item.id, open)}
    >
      <AlertDialog.Content
        class={getContentClass(item.size, item.contentClass)}
      >
        <AlertDialog.Header>
          {#if item.title}
            <AlertDialog.Title>{item.title}</AlertDialog.Title>
          {/if}
          {#if item.description}
            <AlertDialog.Description>
              {item.description}
            </AlertDialog.Description>
          {/if}
        </AlertDialog.Header>

        {#if item.component}
          <svelte:component this={item.component} {...item.props ?? {}} />
        {:else if item.content}
          {@render item.content?.()}
        {/if}

        <AlertDialog.Footer variant={item.footerVariant ?? "default"}>
          {#if item.actions}
            {@render item.actions?.()}
          {:else}
            <AlertDialog.Cancel onclick={() => dialog.close(item.id, false)}>
              {item.cancelLabel ?? "Cancel"}
            </AlertDialog.Cancel>
            <AlertDialog.Action onclick={() => dialog.close(item.id, true)}>
              {item.confirmLabel ?? "Confirm"}
            </AlertDialog.Action>
          {/if}
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
  {:else}
    <Dialog.Root
      open={item.open}
      onOpenChange={(open) => handleOpenChange(item.id, open)}
    >
      <Dialog.Content
        showCloseButton={item.showCloseButton ?? true}
        class={getContentClass(item.size, item.contentClass)}
      >
        {#if item.title || item.description}
          <Dialog.Header>
            {#if item.title}
              <Dialog.Title>{item.title}</Dialog.Title>
            {/if}
            {#if item.description}
              <Dialog.Description>{item.description}</Dialog.Description>
            {/if}
          </Dialog.Header>
        {/if}

        {#if item.component}
          <svelte:component this={item.component} {...item.props ?? {}} />
        {:else if item.content}
          {@render item.content?.()}
        {/if}

        {#if item.actions}
          <Dialog.Footer>
            {@render item.actions?.()}
          </Dialog.Footer>
        {/if}
      </Dialog.Content>
    </Dialog.Root>
  {/if}
{/each}
