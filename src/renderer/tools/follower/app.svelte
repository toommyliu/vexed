<script lang="ts">
  // Follower functionality will go here
  let targetUsername = "";
</script>

<div class="mx-auto box-border w-full max-w-4xl p-4">
  <div
    class="mb-4 w-full rounded-md border border-zinc-800 bg-zinc-900 p-4 shadow-md"
  >
    <h1 class="mb-4 text-xl text-white">Follower</h1>
    <div class="flex flex-col gap-4">
      <div>
        <label for="target-username" class="mb-2 block text-gray-400"
          >Target Username</label
        >
        <input
          id="target-username"
          type="text"
          bind:value={targetUsername}
          class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          placeholder="Enter username to follow"
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
