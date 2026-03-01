<script lang="ts">
  import type { ServerData } from "@vexed/game";
  import {
    AppFrame,
    Button,
    Checkbox,
    DialogHost,
    Icon,
    Input,
    Select,
    Switch,
    dialog,
  } from "@vexed/ui";
  import { Result } from "better-result";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  import AddAccountDialog from "./components/add-account-dialog.svelte";
  import EditAccountDialog from "./components/edit-account-dialog.svelte";

  import { managerState } from "./state.svelte";
  import { servers, selectedServer } from "./state/servers";
  import { removeAccount, startAccount } from "./util";

  import type { ManagerIpcError } from "~/shared/manager/errors";
  import { client, handlers } from "~/shared/tipc";
  import type { Account } from "~/shared/types";

  const { accounts, selectedAccounts } = managerState;
  let searchQuery = $state("");
  let isLoading = $state(true);

  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  let editingAccount = $state<Account | null>(null);

  let deleteDialogLoading = $state(false);
  let deleteDialogError = $state("");
  let pendingDeleteUsernames = $state<string[]>([]);

  let serverFetchError = $state("");
  let isRetryingServerFetch = $state(false);
  let accountsLoadError = $state("");

  const filteredAccounts = $derived(
    Array.from(accounts.values()).filter((acc) =>
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  const selectedCount = $derived(selectedAccounts.size);
  const isAllSelected = $derived(
    filteredAccounts.length > 0 &&
      filteredAccounts.every((a) =>
        selectedAccounts.has(a.username.toLowerCase()),
      ),
  );

  async function loadServers() {
    try {
      serverFetchError = "";

      const serializedServers = await client.app.getServers();
      const serversResult = Result.deserialize<ServerData[], unknown>(
        serializedServers,
      );
      if (serversResult.isOk()) {
        servers.clear();
        for (const [idx, server] of serversResult.value.entries()) {
          // Set the default selected server to the first one if none is selected
          if (idx === 0 && !get(selectedServer))
            selectedServer.set(`${server.sName} (${server.iCount})`);
          servers.set(server.sName, server);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      serverFetchError = "Connection error. Please check your internet.";
    }
  }

  onMount(async () => {
    isLoading = true;
    accountsLoadError = "";

    const [serializedAccounts] = await Promise.all([
      client.manager.getAccounts(),
      loadServers(),
    ]);

    const accountResult = Result.deserialize<Account[], ManagerIpcError>(
      serializedAccounts,
    );

    if (accountResult.isOk()) {
      accounts.clear();
      for (const account of accountResult.value) {
        if (typeof account?.username !== "string") continue;
        accounts.set(account.username.toLowerCase(), account);
      }
    } else {
      console.error("Failed to load accounts:", accountResult.error);
      accountsLoadError = "Failed to load accounts. Please try restarting.";
    }

    isLoading = false;
  });

  async function retryServerFetch() {
    isRetryingServerFetch = true;
    await loadServers();
    isRetryingServerFetch = false;
  }

  function toggleSelection(username: string) {
    const key = username.toLowerCase();
    if (selectedAccounts.has(key)) {
      selectedAccounts.delete(key);
    } else {
      selectedAccounts.add(key);
    }
  }

  function toggleAll() {
    if (isAllSelected) {
      selectedAccounts.clear();
    } else {
      selectedAccounts.clear();
      filteredAccounts.forEach((a) =>
        selectedAccounts.add(a.username.toLowerCase()),
      );
    }
  }

  function toggleSelected() {
    const currentSelected = new Set(selectedAccounts);
    selectedAccounts.clear();
    filteredAccounts.forEach((a) => {
      const key = a.username.toLowerCase();
      if (!currentSelected.has(key)) {
        selectedAccounts.add(key);
      }
    });
  }

  async function handleRemove(usernames: string[]) {
    pendingDeleteUsernames = usernames;
    deleteDialogError = "";
    deleteDialogLoading = false;

    const confirmed = await dialog.confirm({
      title: `Remove ${pendingDeleteUsernames.length} account${
        pendingDeleteUsernames.length === 1 ? "" : "s"
      }?`,
      description: deleteDialogError || "This action cannot be undone.",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      footerVariant: "bare",
      size: "sm",
    });

    if (!confirmed) {
      pendingDeleteUsernames = [];
      return;
    }

    deleteDialogLoading = true;
    deleteDialogError = "";
    const failed: string[] = [];

    for (const u of pendingDeleteUsernames) {
      const acc = accounts.get(u.toLowerCase());
      if (acc) {
        const success = await removeAccount(acc);
        if (success) {
          accounts.delete(u.toLowerCase());
          selectedAccounts.delete(u.toLowerCase());
        } else {
          failed.push(u);
        }
      }
    }

    deleteDialogLoading = false;

    if (failed.length > 0) {
      deleteDialogError = `Failed to remove ${failed.length} account(s). Please try again.`;
      await dialog.confirm({
        title: "Remove failed",
        description: deleteDialogError,
        confirmLabel: "Ok",
        cancelLabel: "Close",
      });
    }

    pendingDeleteUsernames = [];
  }

  function handleStart(usernames: string[]) {
    for (const u of usernames) {
      const acc = accounts.get(u.toLowerCase());
      if (acc) {
        const serverName = get(selectedServer)?.split(" (")?.[0] ?? null;
        startAccount({
          ...acc,
          server: serverName,
        });
      }
    }
  }

  async function selectScript() {
    const path = await client.app.loadScript({});
    if (path) {
      console.log(`Loaded script path: ${path}`);
      managerState.scriptPath = path;
      managerState.startWithScript = true;
    }
  }

  function handleAddAccount() {
    isAddOpen = true;
  }

  handlers.manager.onLogin.listen((username) => {
    console.log(`${username} completed log in...`);
  });
</script>

<AppFrame.Root>
  <AppFrame.Header title="Account Manager">
    {#snippet right()}
      <Button
        variant="outline"
        size="sm"
        class="gap-2"
        onclick={handleAddAccount}
      >
        <Icon icon="plus" class="h-4 w-4" />
        <span class="hidden sm:inline">Add Account</span>
      </Button>
    {/snippet}
  </AppFrame.Header>
  <AppFrame.Body>
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-3">
      <div class="flex flex-col gap-3">
        <div class="relative">
          <Icon
            icon="search"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search accounts..."
            class="border-border/50 bg-secondary/50 pl-10 transition-colors focus:bg-background"
            bind:value={searchQuery}
          />
        </div>

        {#if accountsLoadError}
          <div
            class="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {accountsLoadError}
          </div>
        {/if}

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {#if serverFetchError}
            <Button
              variant="outline"
              onclick={retryServerFetch}
              disabled={isRetryingServerFetch}
              class="flex h-10 w-full items-center justify-between gap-2 border-destructive/20 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/10"
            >
              <span class="truncate text-xs font-medium"
                >{serverFetchError}</span
              >
              <span
                class="shrink-0 rounded bg-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-widest text-destructive-foreground"
              >
                {isRetryingServerFetch ? "..." : "Retry"}
              </span>
            </Button>
          {:else}
            <Select.Root>
              <Select.Trigger
                class="w-full border-border/50 bg-secondary/50 transition-colors hover:bg-secondary"
                disabled={servers.size === 0}
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm text-muted-foreground">Login Server</span
                  >
                  <span class="truncate text-sm text-foreground"
                    >{$selectedServer.split(" (")?.[0] ??
                      "Loading servers..."}</span
                  >
                </div>
              </Select.Trigger>
              <Select.Content>
                {#each servers.values() as server (server.sName)}
                  <Select.Item value={`${server.sName} (${server.iCount})`}>
                    <span
                      class="flex w-full items-center justify-between gap-4"
                    >
                      <span>{server.sName}</span>
                      <span class="text-xs tabular-nums text-muted-foreground"
                        >{server.iCount}</span
                      >
                    </span>
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/if}

          <div
            class="group relative flex items-stretch overflow-hidden rounded-lg border transition-all duration-200
                {managerState.startWithScript
              ? 'elevation-1 border-primary/40 bg-primary/5'
              : 'border-border/50 bg-secondary/50'}"
          >
            <label
              class="flex cursor-pointer items-center gap-2 bg-transparent px-3 transition-colors hover:bg-secondary/80"
            >
              <Switch
                bind:checked={managerState.startWithScript}
                class="h-4 w-8 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-4"
              />
              <span
                class="select-none whitespace-nowrap text-sm font-medium transition-colors
                    {managerState.startWithScript
                  ? 'text-foreground'
                  : 'text-muted-foreground'}"
              >
                Script
              </span>
            </label>

            <div
              class="my-1.5 w-px self-stretch transition-colors
                  {managerState.startWithScript
                ? 'bg-primary/20'
                : 'bg-border/30'}"
            ></div>

            <Button
              variant="ghost"
              onclick={selectScript}
              class="flex min-w-0 flex-1 items-center rounded-none border-0 bg-transparent px-3 transition-colors hover:bg-secondary/80"
              title={managerState.scriptPath || "Select a script file"}
            >
              <span
                class="truncate text-sm transition-colors
                    {managerState.scriptPath
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'}"
              >
                {managerState.scriptPath
                  ? managerState.scriptPath.split(/[/\\]/).pop()
                  : "Choose file..."}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-2 text-sm transition-all duration-200 sm:gap-3"
      >
        <div class="flex shrink-0 items-center gap-3">
          <span
            class="flex items-center gap-1.5 text-muted-foreground transition-colors"
          >
            <span
              class="font-medium tabular-nums {selectedCount > 0
                ? 'text-primary'
                : ''}">{selectedCount}</span
            >
            <span class="text-muted-foreground/70">of</span>
            <span class="tabular-nums">{filteredAccounts.length}</span>
            <span class="text-muted-foreground/70">selected</span>
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-0.5 sm:gap-1">
          <Button
            variant="secondary"
            size="sm"
            onclick={toggleAll}
            class="px-2 sm:px-3"
          >
            {isAllSelected ? "None" : "All"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onclick={toggleSelected}
            class="px-2 text-muted-foreground hover:text-foreground sm:px-3"
            title="Invert selection"
          >
            <span class="text-sm font-medium">Invert</span>
          </Button>

          <div
            class="ml-0.5 hidden h-4 w-px bg-border/30 sm:ml-1 sm:block"
          ></div>

          <Button
            variant="destructive-outline"
            size="sm"
            onclick={() => handleRemove(Array.from(selectedAccounts))}
            disabled={selectedCount === 0}
            class="ml-0.5 px-2 sm:ml-1 sm:px-3"
          >
            <Icon icon="trash" class="h-4 w-4" />
            <span class="hidden text-sm font-medium sm:inline">Remove</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onclick={() => handleStart(Array.from(selectedAccounts))}
            disabled={selectedCount === 0}
            class="ml-0.5 bg-primary px-2 text-primary-foreground hover:bg-primary/90 sm:ml-1 sm:px-3"
            title="Start selected"
          >
            <Icon icon="play" class="h-4 w-4" />
            <span class="hidden text-sm font-medium sm:inline">Start</span>
          </Button>
        </div>
      </div>

      <div class="relative -mx-1 flex-1 overflow-auto px-1">
        {#if isLoading}
          <div
            class="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground"
          >
            <Icon icon="loader" size="xl" spin />
            <p class="text-sm">Loading accounts...</p>
          </div>
        {:else if filteredAccounts.length === 0}
          <div
            class="flex h-full flex-col items-center justify-center gap-3 py-12 text-center"
          >
            <div class="space-y-1">
              <h3 class="font-medium text-foreground">No accounts found</h3>
              <p class="text-sm text-muted-foreground">
                Try adjusting your filters or add a new account.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="border-border/50"
              onclick={() => {
                searchQuery = "";
                selectedServer.set("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        {:else}
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each filteredAccounts as account (account.username)}
              {@const isSelected = selectedAccounts.has(
                account.username.toLowerCase(),
              )}

              <div
                class="group flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-4 transition-all duration-150
                    {isSelected
                  ? 'elevation-2 border-primary/50 bg-primary/5'
                  : 'hover:elevation-1 border-border/50 bg-card hover:border-border hover:bg-secondary/30'}"
                onclick={() => toggleSelection(account.username)}
                role="button"
                tabindex="0"
                onkeydown={(ev: KeyboardEvent) =>
                  ev.key === "Enter" && toggleSelection(account.username)}
              >
                <Checkbox
                  checked={isSelected}
                  onclick={(ev: MouseEvent) => ev.stopPropagation()}
                  onCheckedChange={() => toggleSelection(account.username)}
                />

                <span
                  class="flex-1 truncate text-base font-medium text-foreground"
                  >{account.username}</span
                >

                <div
                  class="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    onclick={(ev: MouseEvent) => {
                      ev.stopPropagation();
                      handleStart([account.username]);
                    }}
                  >
                    <Icon icon="play" class="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    onclick={(ev) => {
                      ev.stopPropagation();
                      editingAccount = account;
                      isEditOpen = true;
                    }}
                  >
                    <Icon icon="pencil" class="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onclick={(ev) => {
                      ev.stopPropagation();
                      handleRemove([account.username]);
                    }}
                  >
                    <Icon icon="trash" class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </AppFrame.Body>
</AppFrame.Root>

<AddAccountDialog
  isOpen={isAddOpen}
  onClose={() => {
    isAddOpen = false;
  }}
/>
<EditAccountDialog
  isOpen={isEditOpen}
  account={editingAccount}
  onClose={() => {
    isEditOpen = false;
    editingAccount = null;
  }}
/>
<DialogHost />
