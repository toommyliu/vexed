<script lang="ts">
  import Button from "./Button.svelte";
  import Dialog from "./Dialog.svelte";

  type Props = {
    open: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  };

  let {
    open,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
  }: Props = $props();
</script>

<Dialog {open} onDismiss={onCancel}>
  <div
    class="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-lg"
    onclick={(ev) => ev.stopPropagation()}
    role="presentation"
  >
    {#if title}
      <div class="mb-2">
        <h2 class="text-lg font-semibold text-white">{title}</h2>
      </div>
    {/if}

    {#if message}
      <div class="mb-6">
        <p class="text-sm text-zinc-400">{message}</p>
      </div>
    {/if}

    <div class="flex justify-end space-x-3">
      <Button variant="secondary" size="sm" onclick={onCancel}>
        {cancelText}
      </Button>
      <Button variant="destructive" size="sm" onclick={onConfirm}>
        {confirmText}
      </Button>
    </div>
  </div>
</Dialog>

<style>
  div {
    background-color: rgb(24 24 27) !important;
    border-color: rgb(39 39 42) !important;
    color: white !important;
  }
  h2 {
    color: white !important;
  }
  p {
    color: rgb(161 161 170) !important;
  }
</style>