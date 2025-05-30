<script lang="ts">
  // Fast travels functionality will go here
  let roomNumber = "";
</script>

<div class="mx-auto box-border w-full max-w-4xl p-4">
  <div
    class="mb-4 w-full rounded-md border border-zinc-800 bg-zinc-900 p-4 shadow-md"
  >
    <h1 class="mb-4 text-xl text-white">Fast Travels</h1>
    <div
      class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div class="w-full md:flex-1">
        <label for="room-number" class="mb-2 block text-gray-400"
          >Room Number</label
        >
        <input
          id="room-number"
          type="text"
          bind:value={roomNumber}
          class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          placeholder="Enter room number"
        />
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: black;
    color: white;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }
</style>
