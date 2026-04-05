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
    Label,
    dialog,
  } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import { Result } from "better-result";
  import { onMount } from "svelte";

  import AddAccountDialog from "./components/add-account-dialog.svelte";
  import EditAccountDialog from "./components/edit-account-dialog.svelte";

  import { managerState } from "./state.svelte";
  import { servers } from "./state/servers";
  import { removeAccount, startAccount } from "./util";

  import type { ManagerIpcError } from "~/shared/manager/errors";
  import { client } from "~/shared/tipc";
  import type { Account } from "~/shared/types";

  const { accounts, selectedAccounts } = managerState;
  let searchQuery = $state("");
  let isLoading = $state(true);

  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  let editingAccount = $state<Account | null>(null);

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
          if (idx === 0 && !managerState.selectedServer)
            managerState.selectedServer = server.sName;
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
      for (const account of filteredAccounts) {
        selectedAccounts.add(account.username.toLowerCase());
      }
    }
  }

  function toggleSelected() {
    const currentSelected = new Set(selectedAccounts);
    selectedAccounts.clear();
    for (const [username] of accounts) {
      const key = username.toLowerCase();
      if (!currentSelected.has(key)) selectedAccounts.add(key);
    }
  }

  async function handleRemove(usernames: string[]) {
    const backupUsernames = [...usernames];

    const confirmed = await dialog.confirm({
      title: `Remove ${backupUsernames.length} account${
        backupUsernames.length === 1 ? "" : "s"
      }?`,
      description: "This action cannot be undone.",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      footerVariant: "bare",
      size: "sm",
    });

    if (!confirmed) {
      return;
    }

    const failed = [];

    for (const username of backupUsernames) {
      const acc = accounts.get(username.toLowerCase());
      if (acc) {
        const success = await removeAccount(acc);
        if (success) {
          accounts.delete(username.toLowerCase());
          selectedAccounts.delete(username.toLowerCase());
        } else {
          failed.push(username);
        }
      }
    }

    if (failed.length > 0) {
      const errorMessage = `Failed to remove ${failed.length} account(s). Please try again.`;
      await dialog.confirm({
        title: "Remove failed",
        description: errorMessage,
        confirmLabel: "Ok",
        cancelLabel: "Close",
      });
    }
  }

  function handleStart(usernames: string[]) {
    for (const username of usernames) {
      const acc = accounts.get(username.toLowerCase());
      if (acc) {
        const serverName = managerState.selectedServer ?? null;
        void startAccount({
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
</script>

<AppFrame.Root>
  <AppFrame.Header title="Account Manager">
    {#snippet right()}
      <Button
        variant="outline"
        class="h-7 gap-1.5 px-2 text-xs"
        onclick={handleAddAccount}
      >
        <Icon icon="plus" class="size-3.5" />
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
            class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search accounts..."
            class="h-7 border-input bg-input/20 pl-8 text-xs/relaxed transition-colors focus:bg-background"
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
            <Select.Root bind:value={managerState.selectedServer}>
              <Select.Trigger
                class="h-7 w-full border-input bg-input/20 px-2 text-xs/relaxed transition-colors hover:bg-input/30"
                disabled={servers.size === 0}
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">Login Server</span
                  >
                  <span class="truncate text-xs font-medium text-foreground"
                    >{managerState.selectedServer ?? "Loading servers..."}</span
                  >
                </div>
              </Select.Trigger>
              <Select.Content>
                {#each servers.values() as server (server.sName)}
                  <Select.Item value={server.sName}>
                    <span
                      class="flex w-full items-center justify-between gap-4 text-xs"
                    >
                      <span>{server.sName}</span>
                      <span
                        class="text-[0.625rem] tabular-nums text-muted-foreground"
                        >{server.iCount}</span
                      >
                    </span>
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/if}

          <div
            class={cn(
              "group relative flex items-stretch overflow-hidden rounded-lg border transition-all duration-100",
              {
                "border-primary/40 bg-primary/5 ring-1 ring-primary/40":
                  managerState.startWithScript,
                "border-input bg-input/20": !managerState.startWithScript,
              },
            )}
          >
            <Label
              class="flex h-7 cursor-pointer items-center gap-2 bg-transparent px-2 transition-colors hover:bg-input/30"
            >
              <Switch
                bind:checked={managerState.startWithScript}
                class="h-[14px] w-6 [&>span]:size-2.5 [&>span]:data-[state=checked]:translate-x-2.5"
              />
              <span
                class={cn(
                  "select-none whitespace-nowrap text-xs font-medium transition-colors",
                  {
                    "text-foreground": managerState.startWithScript,
                    "text-muted-foreground": !managerState.startWithScript,
                  },
                )}
              >
                Script
              </span>
            </Label>

            <div
              class={cn("my-1 w-px self-stretch transition-colors", {
                "bg-primary/20": managerState.startWithScript,
                "bg-input/30": !managerState.startWithScript,
              })}
            ></div>

            <Button
              variant="ghost"
              onclick={selectScript}
              class="flex h-7 min-w-0 flex-1 items-center rounded-none border-0 bg-transparent px-2 text-xs transition-colors hover:bg-input/30"
              title={managerState.scriptPath ?? "Select a script file"}
            >
              <span
                class={cn("truncate transition-colors", {
                  "font-medium text-foreground": managerState.scriptPath,
                  "text-muted-foreground": !managerState.scriptPath,
                })}
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
        class="flex flex-wrap items-center justify-between gap-2 text-xs transition-all duration-100 sm:gap-3"
      >
        <div class="flex shrink-0 items-center gap-2">
          <span
            class="flex items-center gap-1.5 text-muted-foreground transition-colors"
          >
            <span
              class={cn("font-medium tabular-nums", {
                "text-primary": selectedCount > 0,
              })}
            >
              {selectedCount}
            </span>
            <span class="text-muted-foreground/60">of</span>
            <span class="tabular-nums">{filteredAccounts.length}</span>
            <span class="text-muted-foreground/60">selected</span>
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-1">
          <Button
            variant="secondary"
            class="h-7 px-2.5 text-xs font-medium"
            onclick={toggleAll}
          >
            {isAllSelected ? "None" : "All"}
          </Button>

          <Button
            variant="ghost"
            class="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onclick={toggleSelected}
            title="Invert selection"
          >
            Invert
          </Button>

          <div class="mx-1 hidden h-4 w-px bg-border/20 sm:block"></div>

          <Button
            variant="destructive-outline"
            class="h-7 gap-1.5 px-2.5 text-xs font-medium"
            onclick={() => void handleRemove(Array.from(selectedAccounts))}
            disabled={selectedCount === 0}
          >
            <Icon icon="trash" class="size-3.5" />
            <span class="hidden sm:inline">Remove</span>
          </Button>

          <Button
            variant="default"
            class="h-7 gap-1.5 px-2.5 text-xs font-medium"
            onclick={() => handleStart(Array.from(selectedAccounts))}
            disabled={selectedCount === 0}
            title="Start selected"
          >
            <Icon icon="play" class="size-3.5" />
            <span class="hidden sm:inline">Start</span>
          </Button>
        </div>
      </div>

      <div class="relative -mx-1 flex-1 overflow-auto p-1">
        {#if isLoading}
          <div
            class="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <Icon icon="loader" size="lg" spin />
            <p class="text-xs">Loading accounts...</p>
          </div>
        {:else if filteredAccounts.length === 0}
          <div
            class="flex h-full flex-col items-center justify-center gap-3 py-12 text-center"
          >
            <div class="space-y-1">
              <h3 class="text-sm font-medium text-foreground">
                No accounts found
              </h3>
              <p class="text-xs text-muted-foreground">
                Try adjusting your filters or add a new account.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="border-border/50"
              onclick={() => {
                searchQuery = "";
                managerState.selectedServer = "";
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
                class={cn(
                  "group flex cursor-default items-center gap-3 overflow-hidden rounded-lg px-3 ring-1 transition-all duration-100",
                  {
                    "elevation-1 bg-primary/5 ring-primary/40": isSelected,
                    "bg-card ring-foreground/10 hover:bg-muted/30 hover:ring-foreground/20":
                      !isSelected,
                  },
                )}
                onclick={() => {}}
                role="none"
                tabindex="-1"
              >
                <Label
                  class="flex flex-1 cursor-pointer items-center gap-3 py-3"
                >
                  <Checkbox
                    checked={isSelected}
                    class="size-3.5"
                    onCheckedChange={() => toggleSelection(account.username)}
                  />

                  <span
                    class="flex-1 truncate text-sm font-medium text-foreground"
                    >{account.username}</span
                  >
                </Label>

                <div
                  class="flex items-center gap-1 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                >
                  <Button
                    variant="ghost"
                    class="size-7 p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    onclick={(ev: MouseEvent) => {
                      ev.stopPropagation();
                      handleStart([account.username]);
                    }}
                  >
                    <Icon icon="play" class="size-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    class="size-7 p-0 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    onclick={(ev) => {
                      ev.stopPropagation();
                      editingAccount = account;
                      isEditOpen = true;
                    }}
                  >
                    <Icon icon="pencil" class="size-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    class="size-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onclick={async (ev) => {
                      ev.stopPropagation();
                      await handleRemove([account.username]);
                    }}
                  >
                    <Icon icon="trash" class="size-3.5" />
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
