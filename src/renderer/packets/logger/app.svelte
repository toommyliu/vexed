<script lang="ts">
  // Packet logger functionality will go here
  let packets: any[] = [];
  let activeTab = "all";
</script>

<div class="mx-auto box-border w-full max-w-5xl p-4">
  <div class="mb-3 flex flex-wrap border-b border-zinc-800 bg-zinc-950 pb-1">
    <h1 class="mb-4 text-xl text-white">Packet Logger</h1>
  </div>

  <div class="mb-4 flex gap-2">
    <button
      class="tab-button rounded px-3 py-1 text-sm"
      class:active={activeTab === "all"}
      on:click={() => (activeTab = "all")}
    >
      All <span class="ml-1 rounded bg-zinc-700 px-1 py-0.5 text-xs"
        >{packets.length}</span
      >
    </button>
  </div>

  <div class="rounded border border-zinc-800 bg-zinc-900 p-4">
    <p class="text-gray-400">Packet logs will appear here...</p>
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

  .tab-button {
    @apply text-blue-400 transition-colors hover:text-blue-300;
  }

  .tab-button.active {
    @apply text-blue-300;
  }
</style>
