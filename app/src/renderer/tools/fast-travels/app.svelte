<script lang="ts">
  import { Button, Empty, Input } from "@vexed/ui";
  import * as InputGroup from "@vexed/ui/InputGroup";
  import * as AlertDialog from "@vexed/ui/AlertDialog";
  import Plus from "lucide-svelte/icons/plus";
  import Search from "lucide-svelte/icons/search";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import Play from "lucide-svelte/icons/play";
  import Pencil from "lucide-svelte/icons/pencil";
  import Loader from "lucide-svelte/icons/loader";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";
  import MapPin from "lucide-svelte/icons/map-pin";
  import { cn } from "@vexed/ui/util";

  import AddFastTravelModal from "./components/add-fast-travel-modal.svelte";
  import EditFastTravelModal from "./components/edit-fast-travel-modal.svelte";

  import { onMount } from "svelte";

  import { client, handlers } from "@shared/tipc";
  import type { FastTravel } from "@shared/types";
  import { DEFAULT_FAST_TRAVELS } from "@shared/constants";

  let locations = $state<FastTravel[]>([]);
  let roomNumber = $state<number>(100_000);
  let disabled = $state(false);
  let isLoading = $state(true);
  let searchQuery = $state("");

  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  let editingLocation = $state<FastTravel | null>(null);

  let deleteDialogOpen = $state(false);
  let deleteDialogLoading = $state(false);
  let deleteDialogError = $state("");
  let pendingDeleteName = $state<string | null>(null);

  let filteredLocations = $derived(
    locations.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  async function doFastTravel(location: FastTravel) {
    disabled = true;
    await client.fastTravels.doFastTravel({
      location: { ...location, roomNumber },
    });
  }

  handlers.fastTravels.fastTravelEnable.listen(() => (disabled = false));

  onMount(async () => {
    try {
      const fastTravels = await client.fastTravels.getAll();
      locations = fastTravels ?? [];
    } catch (error) {
      console.error("Failed to get fast travels.", error);
      locations = [...DEFAULT_FAST_TRAVELS];
    }

    isLoading = false;
  });

  $effect(() => {
    if (roomNumber < 1 || roomNumber > 100_000) roomNumber = 100_000;
  });

  function handleAddSuccess(fastTravel: FastTravel) {
    locations = [...locations, fastTravel];
  }

  function handleEditSuccess(originalName: string, fastTravel: FastTravel) {
    locations = locations.map((loc) =>
      loc.name.toLowerCase() === originalName.toLowerCase() ? fastTravel : loc
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

    deleteDialogLoading = true;
    deleteDialogError = "";

    const success = await client.fastTravels.removeFastTravel({
      name: pendingDeleteName,
    });

    deleteDialogLoading = false;

    if (success) {
      locations = locations.filter(
        (loc) => loc.name.toLowerCase() !== pendingDeleteName!.toLowerCase()
      );
      deleteDialogOpen = false;
      pendingDeleteName = null;
    } else {
      deleteDialogError = "Failed to remove location. Please try again.";
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

<div class="bg-background flex h-screen flex-col">
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b border-border/50 px-6 py-3 backdrop-blur-xl elevation-1"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <div>
          <h1 class="text-foreground text-base font-semibold tracking-tight">
            Fast Travels
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button size="sm" class="gap-2" onclick={() => (isAddOpen = true)}>
          <Plus class="h-4 w-4" />
          <span class="hidden sm:inline">Add Location</span>
        </Button>
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-hidden p-4 sm:p-6">
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-3">
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="relative">
            <Search
              class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
            />
            <Input
              type="search"
              placeholder="Search locations..."
              class="pl-10 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
              bind:value={searchQuery}
            />
          </div>

            <InputGroup.Root class="bg-secondary/50 border-border/50 focus-within:bg-background transition-colors">
              <InputGroup.Addon>
                <InputGroup.Text class="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Room number 
                </InputGroup.Text>
              </InputGroup.Addon>
              <Input
                id="room-number"
                type="number"
                bind:value={roomNumber}
                min={1}
                max={100_000}
                autocomplete="off"
              />
            </InputGroup.Root>
        </div>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">
          <span class="tabular-nums font-medium text-foreground"
            >{filteredLocations.length}</span
          >
          <span class="text-muted-foreground/70">location{filteredLocations.length !== 1 ? 's' : ''}</span>
        </span>
      </div>

      <div class="relative flex-1 overflow-auto -mx-1 px-1">
        {#if isLoading}
          <div
            class="text-muted-foreground flex h-full flex-col items-center justify-center gap-3"
          >
            <Loader class="text-primary h-6 w-6 animate-spin" />
            <p class="text-sm">Loading locations...</p>
          </div>
        {:else if filteredLocations.length === 0}
          <Empty.Root>
            <Empty.Header>
              <Empty.Media variant="icon">
                <MapPin />
              </Empty.Media>
              <Empty.Title>No locations found</Empty.Title>
              <Empty.Description>
                {searchQuery
                  ? "Try adjusting your search or add a new location."
                  : "Add your first fast travel location to get started."}
              </Empty.Description>
            </Empty.Header>
            <Empty.Content>
              {#if searchQuery}
                <Button
                  variant="outline"
                  size="sm"
                  class="border-border/50"
                  onclick={() => (searchQuery = "")}
                >
                  Clear Search
                </Button>
              {:else}
                <Button
                  variant="outline"
                  size="sm"
                  class="border-border/50"
                  onclick={() => (isAddOpen = true)}
                >
                  <Plus class="h-4 w-4 mr-1" />
                  Add Location
                </Button>
              {/if}
            </Empty.Content>
          </Empty.Root>
        {:else}
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each filteredLocations as location (location.name)}
              <div
                class={cn(
                  "group flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-4 transition-all duration-150",
                  "border-border/50 bg-card hover:border-border hover:bg-secondary/30 hover:elevation-1",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                onclick={() => !disabled && doFastTravel(location)}
                role="button"
                tabindex="0"
                onkeydown={(ev: KeyboardEvent) =>
                  ev.key === "Enter" && !disabled && doFastTravel(location)}
              >
                <div class="flex-1 min-w-0">
                  <div class="text-foreground text-base font-medium truncate">
                    {location.name}
                  </div>
                  <div class="text-muted-foreground text-xs truncate">
                    {location.map}{location.cell ? ` › ${location.cell}` : ""}{location.pad ? `:${location.pad}` : ""}
                  </div>
                </div>

                <div
                  class="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onclick={(ev: MouseEvent) => {
                      ev.stopPropagation();
                      if (!disabled) doFastTravel(location);
                    }}
                    {disabled}
                  >
                    <Play class="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    onclick={(ev: MouseEvent) => {
                      ev.stopPropagation();
                      editingLocation = location;
                      isEditOpen = true;
                    }}
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onclick={(ev: MouseEvent) => {
                      ev.stopPropagation();
                      handleRemove(location.name);
                    }}
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

<AddFastTravelModal
  isOpen={isAddOpen}
  onClose={() => (isAddOpen = false)}
  onSuccess={handleAddSuccess}
/>

<EditFastTravelModal
  isOpen={isEditOpen}
  fastTravel={editingLocation}
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
    <AlertDialog.Footer>
      <Button
        variant="outline"
        onclick={cancelDelete}
        disabled={deleteDialogLoading}
        class="min-w-[80px]"
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onclick={confirmDelete}
        disabled={deleteDialogLoading}
        class="min-w-[80px]"
      >
        {#if deleteDialogLoading}
          <LoaderCircle class="size-4 animate-spin" />
          <span>Removing...</span>
        {:else}
          <span>Remove</span>
        {/if}
      </Button>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
