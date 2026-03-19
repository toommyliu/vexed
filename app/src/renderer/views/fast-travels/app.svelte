<script lang="ts">
  import {
    AlertDialog,
    AppFrame,
    Button,
    Icon,
    Input,
    InputGroup,
    TooltipButton,
    Switch,
  } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import { equalsIgnoreCase } from "@vexed/utils/string";
  import { onMount } from "svelte";
  import { Result } from "better-result";

  import AddFastTravelDialog from "./components/add-fast-travel-dialog.svelte";
  import EditFastTravelDialog from "./components/edit-fast-travel-dialog.svelte";

  import type { FastTravel } from "~/shared/fast-travels/types";
  import { client, handlers } from "~/shared/tipc";

  let locations = $state<FastTravel[]>([]);
  let roomNumber = $state<number>(100_000);
  let disabled = $state(false);
  let isLoading = $state(true);
  let searchQuery = $state("");
  let useRoomNumber = $state(false);

  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  let editingLocation = $state<FastTravel | null>(null);

  let deleteDialogOpen = $state(false);
  let deleteDialogLoading = $state(false);
  let deleteDialogError = $state("");
  let pendingDeleteName = $state<string | null>(null);

  const normalizedSearchQuery = $derived(searchQuery.trim().toLowerCase());
  const filteredLocations = $derived(
    locations.filter((loc) =>
      loc.name.toLowerCase().includes(normalizedSearchQuery),
    ),
  );
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  async function doFastTravel(location: FastTravel) {
    disabled = true;

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (disabled) disabled = false;
    }, 10_000);

    try {
      await client.fastTravels.warp({
        location: { ...location, roomNumber },
      });
    } catch (error) {
      console.error("Failed to fast travel", error);
    } finally {
      disabled = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  }

  onMount(() => {
    let cancelled = false;

    (async () => {
      try {
        const serialized = await client.fastTravels.all();
        if (cancelled) return;

        const result = Result.deserialize(serialized);
        if (result.isOk()) locations = result.value as FastTravel[];
        else console.error(result.error);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load fast travels", error);
        }
      } finally {
        // if (!cancelled) isLoading = false;
        setTimeout(() => {
          if (!cancelled) isLoading = false;
        }, 0);
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  });

  $effect(() => {
    if (roomNumber < 1 || roomNumber > 100_000) roomNumber = 100_000;
  });

  handlers.fastTravels.enable.listen(() => (disabled = false));

  function handleAddSuccess(fastTravel: FastTravel) {
    locations = [...locations, fastTravel];
  }

  function handleEditSuccess(originalName: string, fastTravel: FastTravel) {
    locations = locations.map((loc) =>
      loc.name.toLowerCase() === originalName.toLowerCase() ? fastTravel : loc,
    );
  }

  function handleRemove(name: string) {
    pendingDeleteName = name;
    deleteDialogError = "";
    deleteDialogLoading = false;
    deleteDialogOpen = true;
  }

  async function confirmDelete() {
    if (!pendingDeleteName) return;

    const nameToDelete = pendingDeleteName;
    deleteDialogLoading = true;
    deleteDialogError = "";

    try {
      const success = await client.fastTravels.remove({
        name: nameToDelete,
      });

      if (success) {
        locations = locations.filter(
          (loc) => !equalsIgnoreCase(loc.name, nameToDelete),
        );
        deleteDialogOpen = false;
        if (pendingDeleteName === nameToDelete) {
          pendingDeleteName = null;
        }
        return;
      }

      deleteDialogError = "Failed to remove location. Please try again.";
    } catch (error) {
      deleteDialogError = "Failed to remove location. Please try again.";
      console.error("Failed to remove location", error);
    } finally {
      deleteDialogLoading = false;
    }
  }

  function cancelDelete() {
    if (!deleteDialogLoading) {
      deleteDialogOpen = false;
      pendingDeleteName = null;
      deleteDialogError = "";
    }
  }
</script>

<AppFrame.Root>
  <AppFrame.Header title="Fast Travels">
    {#snippet right()}
      <Button size="sm" class="gap-2" onclick={() => (isAddOpen = true)}>
        <Icon icon="plus" size="md" />
        <span class="hidden sm:inline">Add Location</span>
      </Button>
    {/snippet}
  </AppFrame.Header>

  <AppFrame.Body>
    <div class="flex h-full flex-col gap-3">
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="relative">
            <Icon
              icon="search"
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search locations..."
              class="bg-secondary/50 pl-10 transition-colors focus:bg-background"
              bind:value={searchQuery}
              spellcheck={false}
            />
          </div>

          <InputGroup.Root
            class="bg-secondary/50 transition-colors focus-within:bg-background"
          >
            <InputGroup.Addon>
              <Switch bind:checked={useRoomNumber} size="sm" />
              <InputGroup.Text
                class="whitespace-nowrap text-xs font-medium text-muted-foreground"
              >
                Room Number
              </InputGroup.Text>
            </InputGroup.Addon>
            <Input
              id="room-number"
              type="number"
              bind:value={roomNumber}
              min={1}
              max={100_000}
              autocomplete="off"
              disabled={!useRoomNumber}
            />
          </InputGroup.Root>
        </div>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">
          <span class="font-medium tabular-nums text-foreground"
            >{filteredLocations.length}</span
          >
          <span class="text-muted-foreground/70"
            >location{filteredLocations.length === 1 ? "" : "s"}</span
          >
        </span>
      </div>

      <div class="relative -mx-1 flex-1 overflow-auto px-1">
        {#if isLoading}
          <div class="flex h-full flex-col items-center justify-center gap-3">
            <Icon icon="loader" size="xl" spin />
            <p class="text-sm">Loading locations...</p>
          </div>
        {:else if filteredLocations.length === 0}
          <div class="flex h-full flex-col items-center justify-center gap-3">
            <p class="text-centered text-sm text-muted-foreground">
              {searchQuery ? "No locations found." : ""}
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each filteredLocations as location (location.name)}
              <div
                class={cn(
                  "group flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-4 transition-all duration-150",
                  "hover:elevation-1 border-border/50 bg-card hover:border-border hover:bg-secondary/30",
                  disabled && "cursor-not-allowed opacity-50",
                )}
                onclick={() => {
                  if (!disabled) void doFastTravel(location);
                }}
                role="button"
                tabindex="0"
                onkeydown={(ev: KeyboardEvent) => {
                  if (ev.key === "Enter" && !disabled) {
                    void doFastTravel(location);
                  }
                }}
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-base font-medium text-foreground">
                    {location.name}
                  </div>
                  <div class="truncate text-xs text-muted-foreground">
                    {location.map}{location.cell
                      ? ` › ${location.cell}`
                      : ""}{location.pad ? `:${location.pad}` : ""}
                  </div>
                </div>

                <div
                  class="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                >
                  <TooltipButton tooltip="Warp to this location">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      onclick={(ev: MouseEvent) => {
                        ev.stopPropagation();
                        if (!disabled) void doFastTravel(location);
                      }}
                      {disabled}
                    >
                      <Icon icon="play" size="sm" />
                    </Button>
                  </TooltipButton>

                  <TooltipButton tooltip="Edit this location">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      onclick={(ev: MouseEvent) => {
                        ev.stopPropagation();
                        editingLocation = location;
                        isEditOpen = true;
                      }}
                    >
                      <Icon icon="pencil" size="sm" />
                    </Button>
                  </TooltipButton>

                  <TooltipButton tooltip="Remove this location">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onclick={(ev: MouseEvent) => {
                        ev.stopPropagation();
                        handleRemove(location.name);
                      }}
                    >
                      <Icon icon="trash" size="sm" />
                    </Button>
                  </TooltipButton>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </AppFrame.Body>
</AppFrame.Root>

<AddFastTravelDialog
  isOpen={isAddOpen}
  onClose={() => (isAddOpen = false)}
  onSuccess={handleAddSuccess}
/>

<EditFastTravelDialog
  fastTravel={editingLocation}
  isOpen={isEditOpen}
  onClose={() => {
    isEditOpen = false;
    editingLocation = null;
  }}
  onSuccess={handleEditSuccess}
/>

<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Remove location?</AlertDialog.Title>
      <AlertDialog.Description>
        {#if deleteDialogError}
          <span class="text-destructive">{deleteDialogError}</span>
        {:else}
          This will remove <span class="font-medium">{pendingDeleteName}</span> from
          your fast travels. This action cannot be undone.
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer variant="bare">
      <Button
        variant="outline"
        onclick={cancelDelete}
        disabled={deleteDialogLoading}
        class="min-w-[80px]"
      >
        No, keep it
      </Button>
      <Button
        variant="destructive"
        onclick={confirmDelete}
        disabled={deleteDialogLoading}
        class="min-w-[80px]"
      >
        {#if deleteDialogLoading}
          <Icon icon="loader" size="md" spin />
          <span>Removing...</span>
        {:else}
          <span>Yes, remove it</span>
        {/if}
      </Button>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
