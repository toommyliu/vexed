<script lang="ts">
  import { Button, Dialog, Icon, Input, Label } from "@vexed/ui";
  import { motionFade } from "@vexed/ui/motion";

  import type { FastTravel } from "~/shared/fast-travels/types";

  import {
    createFastTravelFormValues,
    normalizeFastTravelFormValues,
    type FastTravelSubmitResult,
  } from "./fast-travel-form";

  type Props = {
    initialFastTravel: FastTravel | null;
    isOpen: boolean;
    onClose(this: void): void;
    onSubmit(
      this: void,
      fastTravel: FastTravel,
    ): Promise<FastTravelSubmitResult>;
    onSuccess(this: void, originalName: string, fastTravel: FastTravel): void;
    submitLabel: string;
    title: string;
  };

  const {
    initialFastTravel,
    isOpen,
    onClose,
    onSubmit,
    onSuccess,
    submitLabel,
    title,
  }: Props = $props();

  let name = $state("");
  let map = $state("");
  let cell = $state("");
  let pad = $state("");
  let isSubmitting = $state(false);
  let error = $state("");
  let fieldError = $state<"map" | "name" | null>(null);

  $effect(() => {
    if (isOpen) {
      const values = createFastTravelFormValues(initialFastTravel);
      name = values.name;
      map = values.map;
      cell = values.cell;
      pad = values.pad;
      error = "";
      fieldError = null;
      return;
    }

    name = "";
    map = "";
    cell = "";
    pad = "";
    error = "";
    fieldError = null;
    isSubmitting = false;
  });

  async function handleSubmit(ev: SubmitEvent) {
    ev.preventDefault();

    const normalized = normalizeFastTravelFormValues({
      cell,
      map,
      name,
      pad,
    });

    if (!normalized.ok) {
      error = normalized.error;
      fieldError = normalized.fieldError;
      return;
    }

    isSubmitting = true;
    error = "";
    fieldError = null;

    try {
      const result = await onSubmit(normalized.value);

      if (result.ok) {
        onSuccess(initialFastTravel?.name ?? "", normalized.value);
        onClose();
        return;
      }

      error = result.error;
      fieldError = result.fieldError ?? null;
    } catch (submitError) {
      error = "Failed to save location. Please try again.";
      console.error("Failed to save fast travel", submitError);
    } finally {
      isSubmitting = false;
    }
  }

  function clearError() {
    if (error) {
      error = "";
      fieldError = null;
    }
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content showCloseButton={true} class="sm:max-w-md">
    <Dialog.Header class="pb-2">
      <Dialog.Title class="text-lg font-semibold tracking-tight">
        {title}
      </Dialog.Title>
    </Dialog.Header>

    <form onsubmit={handleSubmit} class="grid gap-4 px-6">
      {#if error}
        {#key error}
          <div
            transition:motionFade={{ duration: 150 }}
            class="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
          >
            <Icon
              icon="circle_alert"
              size="md"
              class="mt-0.5 shrink-0 text-destructive"
            />
            <span class="text-sm text-destructive">{error}</span>
          </div>
        {/key}
      {/if}

      <div class="grid gap-2">
        <Label for="name" class="text-sm font-medium">Name</Label>
        <Input
          id="name"
          bind:value={name}
          disabled={isSubmitting}
          placeholder="e.g. Escherion"
          oninput={clearError}
          class={fieldError === "name" ? "border-destructive/50" : ""}
        />
      </div>

      <div class="grid gap-2">
        <Label for="map" class="text-sm font-medium">Map</Label>
        <Input
          id="map"
          bind:value={map}
          disabled={isSubmitting}
          placeholder="e.g. escherion"
          oninput={clearError}
          class={fieldError === "map" ? "border-destructive/50" : ""}
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="grid gap-2">
          <Label for="cell" class="text-sm font-medium text-muted-foreground">
            Cell <span class="text-xs">(optional)</span>
          </Label>
          <Input
            id="cell"
            bind:value={cell}
            disabled={isSubmitting}
            placeholder="Enter"
          />
        </div>
        <div class="grid gap-2">
          <Label for="pad" class="text-sm font-medium text-muted-foreground">
            Pad <span class="text-xs">(optional)</span>
          </Label>
          <Input
            id="pad"
            bind:value={pad}
            disabled={isSubmitting}
            placeholder="Spawn"
          />
        </div>
      </div>

      <Dialog.Footer variant="bare" class="px-0">
        <Button
          variant="outline"
          type="button"
          onclick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !name.trim() || !map.trim()}
        >
          {#if isSubmitting}
            <Icon icon="loader" size="md" spin />
            <span>Saving...</span>
          {:else}
            <span>{submitLabel}</span>
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
