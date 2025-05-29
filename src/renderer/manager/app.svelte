<script lang="ts">
  import AccountCard from "./components/account-card.svelte";
  import { onMount } from "svelte";
  import { ipcRenderer } from "../../common/ipc";
  import type { Account } from "../../common/types";
  import { IPC_EVENTS } from "../../common/ipc-events";
  import Footer from "./components/footer.svelte";
  import { state } from "./state.svelte";
  import { client } from "./client";

  const { accounts, servers, timeouts } = state;

  ipcRenderer.answerMain(IPC_EVENTS.ENABLE_BUTTON, async ({ username }) => {
    if (timeouts.has(username)) {
      clearTimeout(timeouts.get(username)!);
      timeouts.delete(username);
    }
  });

  onMount(async () => {
    const [accountData, serverData] = await Promise.all([
      client.getAccounts(),
      fetch("https://game.aq.com/game/api/data/servers").then(async (resp) =>
        resp.json(),
      ),
    ]);

    for (const account of accountData!) {
      accounts.set(account.username, account);
    }

    for (let idx = 0; idx < serverData.length; ++idx) {
      if (idx === 0) state.selectedServer = serverData[idx]!.sName;
      servers.set(serverData[idx]!.sName, serverData[idx]!);
    }
  });

  const removeAccount = async (account: Account) => {
    console.log("remove account", account);
  };
  const startAccount = async (account: AccountWithServer) => {
    if (timeouts.has(account.username)) {
      clearTimeout(timeouts.get(account.username)!);
    }

    const timeout = setTimeout(() => {
      timeouts.delete(account.username);
    }, 10_000); // 10s should be sufficient
    state.timeouts.set(account.username, timeout);

    await ipcRenderer.callMain(IPC_EVENTS.LAUNCH_GAME, account);
  };
</script>

<main
  class="flex min-h-screen select-none flex-col"
  style="background: linear-gradient(135deg, #0a0a0a 0%, #171717 25%, #262626 50%, #1a1a1a 75%, #0a0a0a 100%);"
>
  <div class="mx-auto box-border w-full max-w-4xl flex-grow p-6">
    <div
      class="mb-6 w-full rounded-xl border border-zinc-700/50 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 shadow-2xl backdrop-blur-sm"
      id="add-account-section"
    >
      <div
        class="flex h-12 cursor-pointer select-none items-center px-4 transition-all duration-200 hover:bg-zinc-800/50"
        id="accordion-toggle"
      >
        <span
          class="flex items-center gap-2 text-base font-semibold text-white"
        >
          <svg
            class="h-5 w-5 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Account
        </span>
      </div>
      <div
        class="h-0 scale-y-0 overflow-hidden border-t border-zinc-700/30 opacity-0 transition-all duration-300 ease-out"
        id="add-account-form"
      >
        <div class="p-6">
          <div id="alert" class="mb-4 hidden rounded-lg p-3"></div>
          <form id="account-form">
            <div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="space-y-2">
                <label
                  for="username"
                  class="block text-sm font-medium text-gray-300"
                  >Username</label
                >
                <input
                  class="w-full rounded-lg border border-zinc-600/50 bg-zinc-950/50 p-3 text-white placeholder-gray-400 shadow-inner transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  type="text"
                  id="username"
                  name="username"
                  required
                  placeholder="Enter username"
                />
              </div>
              <div class="space-y-2">
                <label
                  for="password"
                  class="block text-sm font-medium text-gray-300"
                  >Password</label
                >
                <input
                  class="w-full rounded-lg border border-zinc-600/50 bg-zinc-950/50 p-3 text-white placeholder-gray-400 shadow-inner transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  id="password"
                  name="password"
                  required
                  placeholder="Enter password"
                />
              </div>
            </div>
            <button
              type="submit"
              class="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              Add Account
            </button>
          </form>
        </div>
      </div>
    </div>

    <div id="accounts" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {#each Array.from(accounts.values()) as account}
        <AccountCard {account} {removeAccount} {startAccount} />
      {/each}
    </div>
  </div>

  <Footer />
</main>
