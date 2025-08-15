<script lang="ts">
  import { cn } from "../../../shared";
  import { client, handlers } from "../../../shared/tipc";

  let packets = $state<string[]>([]);
  let packetInput = $state("");
  let delay = $state(1000);
  let isRunning = $state(false);
  let selectedPacketIndex = $state<number | null>(null);

  const canStart = $derived(packets.length > 0 && !isRunning);
  const canStop = $derived(isRunning);
  const canRemove = $derived(selectedPacketIndex !== null && !isRunning);
  const canAdd = $derived(packetInput.trim().length > 0 && !isRunning);

  function clearPackets() {
    packets = [];
    selectedPacketIndex = null;
  }

  function addPacket() {
    if (!packetInput.trim()) return;

    packets = [...packets, packetInput.trim()];
  }

  function removePacket() {
    if (selectedPacketIndex === null) return;

    packets = packets.filter((_, index) => index !== selectedPacketIndex);
    selectedPacketIndex = null;
  }

  $effect(() => {
    if (isRunning) {
      void client.packetSpammer.packetSpammerStart({ packets, delay });
    } else {
      void client.packetSpammer.packetSpammerStop();
    }
  });

  handlers.game.gameReloaded.listen(() => (isRunning = false));
</script>

<div class="bg-background-primary min-h-screen text-white">
  <div class="mx-auto box-border w-full max-w-4xl p-4">
    <div class="w-full">
      <div class="mb-4">
        <div
          class="bg-background-secondary w-full rounded-md border border-zinc-800 p-4 shadow-md"
        >
          <div
            class="h-[135px] max-h-[350px] min-h-[135px] w-full resize-y overflow-auto rounded border border-zinc-800 bg-gray-800/50 p-2"
          >
            {#if packets.length === 0}
              <div
                class="flex h-full items-center justify-center text-gray-500"
              >
                No packets added yet
              </div>
            {:else}
              {#each packets as packet, index}
                <div
                  class={cn(
                    "m-1 block w-max cursor-pointer rounded p-1 text-sm text-white transition-colors",
                    isRunning ? "cursor-default" : "cursor-pointer",
                    selectedPacketIndex === index
                      ? "bg-zinc-700"
                      : "hover:bg-zinc-800",
                  )}
                  onclick={() =>
                    (selectedPacketIndex =
                      selectedPacketIndex === index ? null : index)}
                  onkeydown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.preventDefault();
                      selectedPacketIndex =
                        selectedPacketIndex === index ? null : index;
                    }
                  }}
                  role="button"
                  tabindex="0"
                >
                  {packet}
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>

      <div
        class="bg-background-secondary w-full rounded-md border border-zinc-800 p-4 shadow-md"
      >
        <div class="mb-4 space-y-3">
          <div class="flex w-full items-center justify-between">
            <label for="packet" class="w-1/4 text-gray-400">Packet</label>
            <input
              type="text"
              id="packet"
              bind:value={packetInput}
              onkeydown={(ev) => {
                if (ev.key === "Enter" && canAdd) {
                  ev.preventDefault();
                  addPacket();
                }
              }}
              disabled={isRunning}
              placeholder="Enter packet"
              class="h-8 w-3/4 rounded-md border border-zinc-800 bg-gray-800/50 p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div class="flex w-full items-center justify-between">
            <label for="delay" class="w-1/4 text-gray-400">Delay (ms)</label>
            <input
              type="number"
              id="delay"
              bind:value={delay}
              step="100"
              min="10"
              disabled={isRunning}
              class="h-8 w-3/4 rounded-md border border-zinc-800 bg-gray-800/50 p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div class="mt-4 flex justify-between">
          <div class="space-x-2">
            <button
              class={cn(
                "rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 transition-colors",
                !isRunning
                  ? "cursor-pointer hover:bg-zinc-700"
                  : "cursor-not-allowed opacity-50",
              )}
              onclick={clearPackets}
              disabled={isRunning}
            >
              Clear
            </button>
            <button
              class={cn(
                "rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 transition-colors",
                canRemove
                  ? "cursor-pointer hover:bg-zinc-700"
                  : "cursor-not-allowed opacity-50",
              )}
              onclick={removePacket}
              disabled={!canRemove}
            >
              Remove
            </button>
            <button
              class={cn(
                "rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 transition-colors",
                canAdd
                  ? "cursor-pointer hover:bg-zinc-700"
                  : "cursor-not-allowed opacity-50",
              )}
              onclick={addPacket}
              disabled={!canAdd}
            >
              Add
            </button>
          </div>
          <div class="space-x-2">
            <button
              class={cn(
                "rounded-md border px-3 py-1 font-medium text-white shadow-md transition-all duration-200",
                canStop
                  ? "cursor-pointer border-red-600/50 bg-red-900/30 text-red-200 hover:bg-red-800/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  : "cursor-not-allowed border-zinc-700 bg-zinc-800 opacity-50",
              )}
              onclick={() => (isRunning = false)}
              disabled={!canStop}
            >
              Stop
            </button>
            <button
              class={cn(
                "rounded-md px-3 py-1 font-medium text-white shadow-md transition-all duration-200",
                canStart
                  ? "cursor-pointer bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  : "cursor-not-allowed border border-zinc-700 bg-zinc-800 opacity-50",
              )}
              onclick={() => (isRunning = true)}
              disabled={!canStart}
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
