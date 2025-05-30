<script lang="ts">
  // Packet spammer functionality will go here
  let packetData = "";
  let interval = 1000;
  let isRunning = false;
</script>

<div class="mx-auto box-border w-full max-w-5xl p-4">
  <div
    class="mb-4 w-full rounded-md border border-zinc-800 bg-zinc-900 p-4 shadow-md"
  >
    <h1 class="mb-4 text-xl text-white">Packet Spammer</h1>

    <div class="flex flex-col gap-4">
      <div>
        <label for="packet-data" class="mb-2 block text-gray-400"
          >Packet Data</label
        >
        <textarea
          id="packet-data"
          bind:value={packetData}
          class="h-32 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          placeholder="Enter packet data..."
        ></textarea>
      </div>

      <div>
        <label for="interval" class="mb-2 block text-gray-400"
          >Interval (ms)</label
        >
        <input
          id="interval"
          type="number"
          bind:value={interval}
          class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          min="100"
        />
      </div>

      <button
        class="rounded px-4 py-2 transition-colors"
        class:bg-red-600={isRunning}
        class:bg-green-600={!isRunning}
        class:hover:bg-red-700={isRunning}
        class:hover:bg-green-700={!isRunning}
        on:click={() => (isRunning = !isRunning)}
      >
        {isRunning ? "Stop" : "Start"} Spamming
      </button>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: rgb(9, 9, 11);
    color: rgb(229, 231, 235);
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }
</style>
