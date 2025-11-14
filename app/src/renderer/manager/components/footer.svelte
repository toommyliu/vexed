<script lang="ts">
  import { cn } from "../../../shared";
  import { managerState } from "../state.svelte";
  import { client } from "../../../shared/tipc";
  import { removeAccount, startAccount } from "../util";

  let selectedCount = $derived(managerState.selectedAccounts.size);

  let allSelected = $derived(
    managerState.selectedAccounts.size === managerState.accounts.size &&
      managerState.accounts.size > 0,
  );

  const toggleAll = () => {
    if (allSelected) {
      managerState.selectedAccounts.clear();
    } else {
      for (const username of managerState.accounts.keys())
        managerState.selectedAccounts.add(username);
    }
  };

  const startSelected = async () => {
    if (managerState.selectedAccounts.size === 0) return;

    for (const username of managerState.selectedAccounts) {
      const account = managerState.accounts.get(username);
      if (!account) continue;

      if (managerState.timeouts.has(username)) continue;

      await startAccount(account);
    }
  };
  const removeSelected = async () => {
    if (managerState.selectedAccounts.size === 0) return;

    for (const username of managerState.selectedAccounts) {
      const account = managerState.accounts.get(username);
      if (!account) continue;

      await removeAccount(account);
    }
  };
</script>

<footer
  class="sticky bottom-0 z-10 flex-shrink-0 border-t border-zinc-700/30 bg-[#0f0f0f] p-6 shadow-2xl backdrop-blur-md"
>
  <div
    class="mx-auto flex w-full max-w-4xl flex-col sm:flex-row sm:items-center sm:justify-between sm:space-x-6"
  >
    <div class="flex flex-col space-y-4 sm:w-1/2">
      <div class="flex items-center space-x-3">
        <label
          for="servers"
          class="whitespace-nowrap text-sm font-medium text-gray-300"
          >Login Server:</label
        >
        <select
          id="servers"
          class="w-full rounded-lg border border-zinc-600/30 bg-zinc-950/80 p-2.5 text-white shadow-inner transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          onchange={(ev) =>
            (managerState.selectedServer = (
              ev.currentTarget as HTMLSelectElement
            ).value)}
        >
          {#each managerState.servers.values() as server}
            <option value={server.sName}
              >{server.sName} ({server.iCount})</option
            >
          {/each}
        </select>
      </div>

      <div class="flex flex-col space-y-2">
        <div class="flex min-w-0 items-center space-x-3 text-sm text-gray-300">
          <input
            type="checkbox"
            id="start-with-script"
            class="rounded border-zinc-600/50 bg-zinc-950/80 text-emerald-500 transition-colors focus:ring-emerald-500/20"
            bind:checked={managerState.startWithScript}
          />
          <label for="start-with-script" class="whitespace-nowrap font-medium"
            >Start with script</label
          >
          <div class="flex items-center space-x-2">
            <button
              class={cn(
                "flex-shrink-0 whitespace-nowrap rounded-lg border border-zinc-600/30 bg-zinc-900/60 px-3 py-1 text-xs text-gray-400 transition-all duration-200",
                !managerState.startWithScript &&
                  "pointer-events-none cursor-not-allowed opacity-50",
                managerState.startWithScript && "hover:bg-zinc-800/60",
              )}
              disabled={!managerState.startWithScript}
              onclick={async () => {
                const res = await client.manager.mgrLoadScript();
                if (!res) return;

                managerState.scriptPath = res;
              }}
            >
              Select file
            </button>
            {#if managerState.startWithScript && managerState.scriptPath}
              <span
                id="selected-script-name"
                class="max-w-[200px] cursor-pointer truncate text-xs text-gray-400 hover:underline"
                title={managerState.scriptPath}
              >
                {managerState.scriptPath.split("/").pop()}
              </span>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div
      class="mt-6 flex flex-col items-start space-y-3 sm:mt-0 sm:w-1/2 sm:items-end"
    >
      <div class="flex items-center space-x-4">
        <span class="text-sm text-gray-300">
          Selected: <span class="font-semibold">{selectedCount}</span>
        </span>
        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            id="select-all"
            class="h-4 w-4 rounded border-zinc-600 bg-zinc-950 text-emerald-500 transition-colors focus:ring-emerald-500/20"
            checked={allSelected}
            onchange={toggleAll}
          />
          <label for="select-all" class="text-sm font-medium text-gray-300"
            >Select All</label
          >
        </div>
      </div>
      <div
        class="flex w-full flex-col items-stretch space-y-2 sm:w-auto sm:flex-row sm:space-x-4 sm:space-y-0"
      >
        <button
          class="w-full rounded-md border border-red-600/50 bg-red-900/30 px-4 py-1.5 text-center text-sm font-medium text-red-200 shadow-lg transition-all duration-200 hover:bg-red-800/40 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 sm:w-auto"
          onclick={removeSelected}
          title="Remove selected accounts"
        >
          Remove Selected
        </button>
        <button
          class="w-full rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-1.5 text-center text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:w-auto"
          onclick={startSelected}
          title="Start selected accounts"
        >
          Start Selected
        </button>
      </div>
    </div>
  </div>
</footer>
