<script lang="ts">
  import { cn } from "../../../shared";
  import { client } from "../../../shared/tipc";

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

  function selectPacket(index: number) {
    selectedPacketIndex = selectedPacketIndex === index ? null : index;
  }

  function handlePacketKeydown(ev: KeyboardEvent) {
    if (ev.key === "Enter" && canAdd) addPacket();
  }

  function getButtonClass(enabled: boolean) {
    const baseClass =
      "rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 transition-colors";

    return cn(
      baseClass,
      enabled
        ? "hover:bg-zinc-700 cursor-pointer"
        : "opacity-50 cursor-not-allowed",
    );
  }

  $effect(() => {
    if (isRunning) {
      void client.packetSpammerStart({ packets, delay });
    } else {
      void client.packetSpammerStop();
    }
  });
</script>

<div class="min-h-screen bg-zinc-950 text-white">
  <div class="mx-auto box-border w-full max-w-4xl p-4">
    <div class="w-full">
      <div class="mb-4">
        <div
          class="w-full rounded-md border border-zinc-800 bg-zinc-900 p-4 shadow-md"
        >
          <div
            class="h-[135px] max-h-[350px] min-h-[135px] w-full resize-y overflow-auto rounded border border-zinc-800 bg-black p-2"
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
                  onclick={() => selectPacket(index)}
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
        class="w-full rounded-md border border-zinc-800 bg-zinc-900 p-4 shadow-md"
      >
        <div class="mb-4 space-y-3">
          <div class="flex w-full items-center justify-between">
            <label for="packet" class="w-1/4 text-gray-400">Packet</label>
            <input
              type="text"
              id="packet"
              bind:value={packetInput}
              onkeydown={handlePacketKeydown}
              disabled={isRunning}
              placeholder="Enter packet"
              class="h-8 w-3/4 rounded-md border border-zinc-800 bg-black p-1 disabled:cursor-not-allowed disabled:opacity-50"
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
              class="h-8 w-3/4 rounded-md border border-zinc-800 bg-black p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div class="mt-4 flex justify-between">
          <div class="space-x-2">
            <button
              class={getButtonClass(!isRunning)}
              onclick={clearPackets}
              disabled={isRunning}
            >
              Clear
            </button>
            <button
              class={getButtonClass(canRemove)}
              onclick={removePacket}
              disabled={!canRemove}
            >
              Remove
            </button>
            <button
              class={getButtonClass(canAdd)}
              onclick={addPacket}
              disabled={!canAdd}
            >
              Add
            </button>
          </div>
          <div class="space-x-2">
            <button
              class={getButtonClass(canStop)}
              onclick={() => (isRunning = false)}
              disabled={!canStop}
            >
              Stop
            </button>
            <button
              class={getButtonClass(canStart)}
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
