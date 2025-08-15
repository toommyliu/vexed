<script lang="ts">
  import { client, handlers } from "../../../shared/tipc";
  import { onMount } from "svelte";
  import type { FastTravelRoomNumber } from "../../../shared/types";
  import { cn } from "../../../shared";

  let locations = $state<Omit<FastTravelRoomNumber, "roomNumber">[]>([]);
  let roomNumber = $state<number>(100_000);
  let disabled = $state(false);

  async function doFastTravel(
    location: Omit<FastTravelRoomNumber, "roomNumber">,
  ) {
    disabled = true;
    await client.fastTravels.doFastTravel({
      location: { ...location, roomNumber },
    });
  }

  handlers.fastTravels.fastTravelEnable.listen(() => (disabled = false));

  onMount(async () => {
    const fastTravels = await client.fastTravels.getFastTravels();
    locations = fastTravels!;
  });

  $effect(() => {
    if (roomNumber < 1 || roomNumber > 100_000) roomNumber = 100_000;
  });
</script>

<main
  class="bg-background-primary m-0 flex min-h-screen flex-col overflow-hidden text-white focus:outline-none"
>
  <div class="flex flex-1 items-center justify-center p-4">
    <div class="w-full px-2 sm:px-4">
      <div
        class="bg-background-secondary rounded-lg border border-gray-800/50 p-6 backdrop-blur-sm"
      >
        <div class="mb-6 space-y-3">
          <label
            for="room-number"
            class="block text-sm font-medium text-gray-300"
          >
            Room Number
          </label>
          <div class="flex space-x-2">
            <input
              id="room-number"
              type="number"
              bind:value={roomNumber}
              class="flex-1 rounded-md border border-gray-700/50 bg-gray-800/50 px-2 py-1.5 text-white placeholder-gray-500 transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="space-y-2">
          <div
            class="grid w-full grid-cols-1 gap-3 rounded-md shadow-md sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {#each locations as location}
              <button
                class={cn(
                  "flex flex-col justify-center rounded-md border border-gray-700/30 bg-gray-800/30 p-3 text-left transition-all duration-200 hover:border-gray-600/50 hover:bg-gray-700/40 hover:shadow-md",
                  disabled && "cursor-not-allowed opacity-50",
                )}
                onclick={() => doFastTravel(location)}
                {disabled}
              >
                <div class="text-sm font-medium text-white">
                  {location.name}
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
