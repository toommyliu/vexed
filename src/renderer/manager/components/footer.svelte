<script lang="ts">
  import { state } from "../state.svelte";
  import { cn } from "../../../shared";
  import { ipcRenderer } from "../../../common/ipc";
  import { IPC_EVENTS } from "../../../common/ipc-events";
</script>

<footer
  class="sticky bottom-0 z-10 flex-shrink-0 border-t border-zinc-700/50 bg-gradient-to-r from-zinc-900/90 to-zinc-800/90 p-6 shadow-2xl backdrop-blur-md"
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
          class="w-full rounded-lg border border-zinc-600/50 bg-zinc-950/50 p-2.5 text-white shadow-inner transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          onchange={(ev) =>
            (state.selectedServer = (
              ev.currentTarget as HTMLSelectElement
            ).value)}
        >
          {#each state.servers.values() as server}
            <option value={server.sName}
              >{server.sName} ({server.iCount})</option
            >
          {/each}
        </select>
      </div>

      <div class="flex flex-col space-y-2">
        <div class="flex items-center space-x-3 text-sm text-gray-300">
          <input
            type="checkbox"
            id="start-with-script"
            class="rounded border-zinc-600 bg-zinc-950 text-emerald-500 transition-colors focus:ring-emerald-500/20"
            bind:checked={state.startWithScript}
          />
          <label for="start-with-script" class="font-medium"
            >Start with script</label
          >
          <div class="flex items-center space-x-2">
            <button
              class={cn(
                "rounded-lg border border-zinc-600/50 bg-zinc-800/50 px-3 py-1 text-xs text-gray-400 transition-all duration-200",
                !state.startWithScript &&
                  "pointer-events-none cursor-not-allowed opacity-50",
                state.startWithScript && "hover:bg-zinc-700/50",
              )}
              disabled={!state.startWithScript}
              onclick={async () => {
                const res = await ipcRenderer.callMain(
                  IPC_EVENTS.MGR_LOAD_SCRIPT,
                );
                if (!res) return;

                state.scriptPath = res;
              }}
            >
              Select file
            </button>
            {#if state.startWithScript && state.scriptPath}
              <span
                id="selected-script-name"
                class="max-w-[200px] cursor-pointer truncate text-xs text-gray-400 hover:underline"
                title={state.scriptPath}
              >
                {state.scriptPath.split("/").pop()}
              </span>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div
      class="mt-6 flex items-center justify-start space-x-4 sm:mt-0 sm:w-1/2 sm:justify-end"
    >
      <button
        id="remove-selected"
        class="rounded-lg border border-red-600/50 bg-red-900/30 px-4 py-2.5 text-sm font-medium text-red-200 shadow-lg transition-all duration-200 hover:bg-red-800/40 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
      >
        Remove Selected
      </button>
      <button
        id="start-selected"
        class="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        Start Selected
      </button>
    </div>
  </div>
</footer>
