<script lang="ts">
  import AccountCard from "./components/account-card.svelte";
  import Header from "./components/header.svelte";
  import AddAccountModal from "./components/add-account-modal.svelte";
  import EditAccountModal from "./components/edit-account-modal.svelte";
  import { onMount } from "svelte";
  import Footer from "./components/footer.svelte";
  import { managerState } from "./state.svelte";
  import { client, handlers } from "../../shared/tipc";
  import { startAccount, removeAccount } from "./util";

  const { accounts, servers, timeouts } = managerState;

  let isLoading = $state(true);
  let isModalOpen = $state(false);
  let isEditModalOpen = $state(false);
  let accountToEdit = $state<Account | null>(null);

  handlers.enableButton.listen((username) => {
    if (timeouts.has(username)) {
      clearTimeout(timeouts.get(username)!);
      timeouts.delete(username);
    }
  });

  const handleEditAccount = (account: Account) => {
    accountToEdit = account;
    isEditModalOpen = true;
  };

  const handleCloseEditModal = () => {
    isEditModalOpen = false;
    accountToEdit = null;
  };

  onMount(async () => {
    const [accountData, serverData] = await Promise.all([
      client.getAccounts(),
      fetch("https://game.aq.com/game/api/data/servers").then((resp) =>
        resp.json(),
      ),
    ]);

    if (Array.isArray(accountData)) {
      for (const account of accountData!) {
        if (
          typeof account?.username !== "string" ||
          typeof account?.password !== "string"
        ) {
          continue;
        }

        accounts.set(account.username.toLowerCase(), account);
      }
    }

    for (let idx = 0; idx < serverData.length; ++idx) {
      if (idx === 0) managerState.selectedServer = serverData[idx]!.sName;
      servers.set(serverData[idx]!.sName, serverData[idx]!);
    }

    isLoading = false;
  });

  handlers.managerLoginSuccess.listen((username) => {
    if (timeouts.has(username)) {
      clearTimeout(timeouts.get(username)!);
      timeouts.delete(username);
    }
  });
</script>

<main class="bg-background-primary flex min-h-screen select-none flex-col">
  <div class="mx-auto box-border w-full max-w-4xl flex-grow p-6">
    <Header onclick={() => (isModalOpen = true)} />

    {#if isLoading}
      <div class="flex h-full flex-col items-center justify-center space-y-4">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500"
        ></div>
        <h2 class="text-xl font-medium text-gray-300">Loading...</h2>
      </div>
    {:else if accounts.size === 0}
      <div class="flex h-full flex-col items-center justify-center space-y-4">
        <h2 class="text-2xl font-semibold text-gray-300">No accounts found</h2>
        <p class="text-gray-400">Add an account to get started</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {#each Array.from(accounts.values()) as account}
          <AccountCard
            {account}
            {removeAccount}
            {startAccount}
            editAccount={handleEditAccount}
          />
        {/each}
      </div>
    {/if}
  </div>

  <Footer />

  <AddAccountModal isOpen={isModalOpen} onClose={() => (isModalOpen = false)} />
  <EditAccountModal
    isOpen={isEditModalOpen}
    account={accountToEdit}
    onClose={handleCloseEditModal}
  />
</main>
