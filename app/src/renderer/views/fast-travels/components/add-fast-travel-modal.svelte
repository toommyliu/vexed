<script lang="ts">
  import type { FastTravel } from "~/shared/types";
  import { Button, Input, Label } from "@vexed/ui";
  import * as Dialog from "@vexed/ui/Dialog";
  import { motionFade } from "@vexed/ui/motion";
  import Loader from "@vexed/ui/icons/Loader";
  import AlertCircle from "@vexed/ui/icons/AlertCircle";
  import { client } from "~/shared/tipc";

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (fastTravel: FastTravel) => void;
  };

  const { isOpen, onClose, onSuccess }: Props = $props();

  let name = $state("");
  let map = $state("");
  let cell = $state("");
  let pad = $state("");
  let isSubmitting = $state(false);
  let error = $state("");
  let fieldError = $state<"name" | "map" | null>(null);

  $effect(() => {
    if (!isOpen) {
      name = "";
      map = "";
      cell = "";
      pad = "";
      error = "";
      fieldError = null;
      isSubmitting = false;
    }
  });

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();

    const cleanName = name?.trim();
    const cleanMap = map?.trim()?.toLowerCase();
    const cleanCell = cell?.trim() || undefined;
    const cleanPad = pad?.trim() || undefined;

    if (!cleanName) {
      error = "Name is required";
      fieldError = "name";
      return;
    }

    if (!cleanMap) {
      error = "Map is required";
      fieldError = "map";
      return;
    }

    isSubmitting = true;
    error = "";
    fieldError = null;

    try {
      const newFastTravel: FastTravel = {
        name: cleanName,
        map: cleanMap,
        ...(cleanCell && { cell: cleanCell }),
        ...(cleanPad && { pad: cleanPad }),
      };

      const res = await client.fastTravels.addFastTravel(newFastTravel);

      switch (res?.msg) {
        case "SUCCESS":
          onSuccess(newFastTravel);
          onClose();
          break;
        case "NAME_ALREADY_EXISTS":
          error = "A location with this name already exists";
          fieldError = "name";
          break;
        case "FAILED":
        default:
          error = "Failed to save location. Please try again.";
      }
    } catch (err) {
      error = "Failed to save location. Please try again.";
      console.error("Failed to add fast travel:", err);
    } finally {
      isSubmitting = false;
    }
  };

  function clearError() {
    if (error) {
      error = "";
      fieldError = null;
    }
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content showCloseButton={true} class="sm:max-w-md">
    <div
      class="via-primary/40 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
    ></div>

    <Dialog.Header class="pb-2">
      <Dialog.Title class="text-lg font-semibold tracking-tight"
        >Add Location</Dialog.Title
      >
    </Dialog.Header>

    <form
      id="add-fast-travel-form"
      onsubmit={handleSubmit}
      class="grid gap-4 px-6"
    >
      {#if error}
        {#key error}
          <div
            transition:motionFade={{ duration: 150 }}
            class="border-destructive/30 bg-destructive/5 flex items-start gap-2.5 rounded-lg border px-3 py-2.5"
          >
            <AlertCircle class="text-destructive mt-0.5 size-4 shrink-0" />
            <span class="text-destructive text-sm">{error}</span>
          </div>
        {/key}
      {/if}

      <div class="grid gap-2">
        <Label for="add-name" class="text-sm font-medium">Name</Label>
        <Input
          id="add-name"
          bind:value={name}
          disabled={isSubmitting}
          placeholder="e.g. Escherion"
          oninput={clearError}
          class={fieldError === "name" ? "border-destructive/50" : ""}
        />
      </div>

      <div class="grid gap-2">
        <Label for="add-map" class="text-sm font-medium">Map</Label>
        <Input
          id="add-map"
          bind:value={map}
          disabled={isSubmitting}
          placeholder="e.g. escherion"
          oninput={clearError}
          class={fieldError === "map" ? "border-destructive/50" : ""}
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="grid gap-2">
          <Label
            for="add-cell"
            class="text-muted-foreground text-sm font-medium"
            >Cell <span class="text-xs">(optional)</span></Label
          >
          <Input
            id="add-cell"
            bind:value={cell}
            disabled={isSubmitting}
            placeholder="Enter"
          />
        </div>
        <div class="grid gap-2">
          <Label for="add-pad" class="text-muted-foreground text-sm font-medium"
            >Pad <span class="text-xs">(optional)</span></Label
          >
          <Input
            id="add-pad"
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
        form="add-fast-travel-form"
        disabled={isSubmitting || !name.trim() || !map.trim()}
      >
        {#if isSubmitting}
          <Loader class="size-4 animate-spin" />
          <span>Saving...</span>
        {:else}
          <span>Add Location</span>
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
