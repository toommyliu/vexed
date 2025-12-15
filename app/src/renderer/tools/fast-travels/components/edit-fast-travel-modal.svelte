<script lang="ts">
  import type { FastTravel } from "~/shared/types";
  import { Button, Input, Label } from "@vexed/ui";
  import * as Dialog from "@vexed/ui/Dialog";
  import { motionFade } from "@vexed/ui/motion";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";
  import AlertCircle from "lucide-svelte/icons/alert-circle";
  import { client } from "~/shared/tipc";

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (originalName: string, fastTravel: FastTravel) => void;
    fastTravel: FastTravel | null;
  };

  const { isOpen, onClose, onSuccess, fastTravel }: Props = $props();

  let name = $state("");
  let map = $state("");
  let cell = $state("");
  let pad = $state("");
  let isSubmitting = $state(false);
  let error = $state("");

  $effect(() => {
    if (isOpen && fastTravel) {
      name = fastTravel.name;
      map = fastTravel.map;
      cell = fastTravel.cell ?? "";
      pad = fastTravel.pad ?? "";
      error = "";
    } else if (!isOpen) {
      name = "";
      map = "";
      cell = "";
      pad = "";
      error = "";
    }
  });

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();

    if (!fastTravel) return;

    const cleanName = name?.trim();
    const cleanMap = map?.trim()?.toLowerCase();
    const cleanCell = cell?.trim() || undefined;
    const cleanPad = pad?.trim() || undefined;

    if (!cleanName || !cleanMap) {
      error = "Please fill in all required fields";
      return;
    }

    isSubmitting = true;
    error = "";

    try {
      const updatedFastTravel: FastTravel = {
        name: cleanName,
        map: cleanMap,
        ...(cleanCell && { cell: cleanCell }),
        ...(cleanPad && { pad: cleanPad }),
      };

      const res = await client.fastTravels.updateFastTravel({
        fastTravel: updatedFastTravel,
        originalName: fastTravel.name,
      });

      switch (res?.msg) {
        case "SUCCESS":
          onSuccess(fastTravel.name, updatedFastTravel);
          onClose();
          break;
        case "NAME_ALREADY_EXISTS":
          error = "A location with this name already exists";
          break;
        case "NOT_FOUND":
          error = "Location not found. It may have been deleted.";
          break;
        case "FAILED":
        default:
          error = "Failed to update location. Please try again.";
      }
    } catch (err) {
      error = "Failed to update location. Please try again.";
      console.error("Failed to update fast travel:", err);
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content showCloseButton={true} class="sm:max-w-md">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>

    <Dialog.Header class="pb-2">
      <Dialog.Title class="text-lg font-semibold tracking-tight">Edit Location</Dialog.Title>
    </Dialog.Header>

    <form id="edit-fast-travel-form" onsubmit={handleSubmit} class="grid gap-4 px-6">
      {#if error}
        {#key error}
          <div
            transition:motionFade={{ duration: 150 }}
            class="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
          >
            <AlertCircle class="size-4 text-destructive shrink-0 mt-0.5" />
            <span class="text-sm text-destructive">{error}</span>
          </div>
        {/key}
      {/if}

      <div class="grid gap-2">
        <Label for="edit-name" class="text-sm font-medium">Name</Label>
        <Input
          id="edit-name"
          bind:value={name}
          disabled={isSubmitting}
          placeholder="e.g. Escherion"
        />
      </div>

      <div class="grid gap-2">
        <Label for="edit-map" class="text-sm font-medium">Map</Label>
        <Input
          id="edit-map"
          bind:value={map}
          disabled={isSubmitting}
          placeholder="e.g. escherion"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="grid gap-2">
          <Label for="edit-cell" class="text-sm font-medium text-muted-foreground">Cell <span class="text-xs">(optional)</span></Label>
          <Input
            id="edit-cell"
            bind:value={cell}
            disabled={isSubmitting}
            placeholder="Enter"
          />
        </div>
        <div class="grid gap-2">
          <Label for="edit-pad" class="text-sm font-medium text-muted-foreground">Pad <span class="text-xs">(optional)</span></Label>
          <Input
            id="edit-pad"
            bind:value={pad}
            disabled={isSubmitting}
            placeholder="Spawn"
          />
        </div>
      </div>
    </form>

    <Dialog.Footer>
      <Button variant="outline" onclick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="edit-fast-travel-form"
        disabled={isSubmitting || !name.trim() || !map.trim()}
      >
        {#if isSubmitting}
          <LoaderCircle class="size-4 animate-spin" />
          <span>Saving...</span>
        {:else}
          <span>Update</span>
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
