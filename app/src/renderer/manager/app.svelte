<script lang="ts">
  import { onMount } from "svelte";
  import {
    Plus,
    Search,
    Trash2,
    Play,
    Server as ServerIcon,
    RotateCcw,
    MoreHorizontal,
    FileCode,
    Pencil,
    User,
    Loader2,
  } from "lucide-svelte";

  import { Button, Input, Checkbox, Separator } from "@vexed/ui";
  import * as Table from "@vexed/ui/Table";
  import * as Dialog from "@vexed/ui/Dialog";
  import * as Menu from "@vexed/ui/Menu";
  import * as Select from "@vexed/ui/Select";

  import { managerState } from "./state.svelte";
  import { removeAccount, startAccount } from "./util";
  import { client } from "../../shared/tipc";
  import EditAccountModal from "./components/edit-account-modal.svelte";

  // State
  const { accounts, servers, timeouts, selectedAccounts } = managerState;

  let searchQuery = $state("");
  let isLoading = $state(true);

  // Configuration State
  // managerState has selectedServer and scriptPath/startWithScript

  // Dialog States
  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  let editingAccount = $state<any>(null); // Type as any for now to match existing or Account type

  // Add Account Form
  let newUsername = $state("");
  let newPassword = $state(""); // Added password field as it's likely needed

  // Derived
  let filteredAccounts = $derived(
    Array.from(accounts.values()).filter((acc) => {
      const matchesSearch = acc.username
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesServer = managerState.selectedServer
        ? acc.server === managerState.selectedServer ||
          managerState.selectedServer.startsWith(acc.server || "")
        : true;
      return matchesSearch && matchesServer;
    }),
  );

  let selectedCount = $derived(selectedAccounts.size);
  let isAllSelected = $derived(
    filteredAccounts.length > 0 &&
      filteredAccounts.every((a) =>
        selectedAccounts.has(a.username.toLowerCase()),
      ),
  );

  // Lifecycle
  onMount(async () => {
    // Load accounts and servers
    const [accountData, serverData] = await Promise.all([
      client.manager.getAccounts(),
      fetch("https://game.aq.com/game/api/data/servers").then((resp) =>
        resp.json(),
      ),
    ]);

    if (Array.isArray(accountData)) {
      for (const account of accountData) {
        if (typeof account?.username !== "string") continue;
        accounts.set(account.username.toLowerCase(), account);
      }
    }

    for (let i = 0; i < serverData.length; i++) {
      const server = serverData[i];
      if (i === 0) {
        managerState.selectedServer = `${server.sName} (${server.iCount})`;
      }
      servers.set(server.sName, server);
    }

    isLoading = false;
  });

  // Actions
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

  async function handleAddAccount() {
    if (!newUsername || !newPassword) return;
    const key = newUsername.toLowerCase();
    if (accounts.has(key)) {
      // toast.error("Account already exists");
      return;
    }

    const newAccount = {
      username: newUsername,
      password: newPassword,
      server: managerState.selectedServer?.split(" (")[0] || "Auto",
      status: "idle",
    };

    // Persist
    await client.manager.addAccount(newAccount);
    accounts.set(key, newAccount);

    newUsername = "";
    newPassword = "";
    isAddOpen = false;
  }

  async function handleRemove(usernames: string[]) {
    if (!confirm(`Remove ${usernames.length} account(s)?`)) return;

    for (const u of usernames) {
      const acc = accounts.get(u.toLowerCase());
      if (acc) {
        await removeAccount(acc);
        selectedAccounts.delete(u.toLowerCase());
      }
    }
  }

  function handleStart(usernames: string[]) {
    usernames.forEach((u) => {
      const acc = accounts.get(u.toLowerCase());
      if (acc) {
        startAccount({
          ...acc,
          server: managerState.selectedServer || null,
        });
      }
    });
  }

  async function selectScript() {
    const res = await client.manager.mgrLoadScript();
    if (res) {
      managerState.scriptPath = res;
      managerState.startWithScript = true;
    }
  }
</script>

<div class="bg-muted/30 flex h-screen flex-col">
  <!-- Header -->
  <header
    class="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b px-6 py-4 backdrop-blur-lg"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl"
        >
          <User class="h-5 w-5" />
        </div>
        <div>
          <h1 class="text-foreground text-lg font-semibold tracking-tight">
            Account Manager
          </h1>
          <p class="text-muted-foreground text-xs font-medium">
            {accounts.size} total accounts
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="hidden sm:flex"
          onclick={() => window.location.reload()}
        >
          <RotateCcw class="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
        <Button size="sm" onclick={() => (isAddOpen = true)}>
          <Plus class="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-hidden p-4 sm:p-6">
    <div
      class="bg-background mx-auto flex h-full max-w-7xl flex-col gap-4 rounded-xl border shadow-sm"
    >
      <!-- Toolbar -->
      <div
        class="bg-card flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        {#if selectedCount > 0}
          <!-- Selection Mode Toolbar -->
          <div
            class="animate-in fade-in slide-in-from-top-2 bg-primary/5 ring-primary/20 flex w-full items-center justify-between rounded-lg px-4 py-1.5 ring-1 ring-inset"
          >
            <div class="flex items-center gap-3">
              <span
                class="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
              >
                {selectedCount}
              </span>
              <span class="text-foreground text-sm font-medium">selected</span>
              <div class="bg-primary/20 h-4 w-px"></div>
              <Button
                variant="ghost"
                size="sm"
                class="hover:bg-primary/10 hover:text-primary h-8 px-2 text-xs"
                onclick={() => selectedAccounts.clear()}
              >
                Clear
              </Button>
            </div>

            <div class="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                class="text-muted-foreground hover:text-destructive h-8"
                onclick={() => handleRemove(Array.from(selectedAccounts))}
              >
                <Trash2 class="mr-2 h-4 w-4" />
                Remove
              </Button>
              <Button
                size="sm"
                class="h-8"
                onclick={() => handleStart(Array.from(selectedAccounts))}
              >
                <Play class="mr-2 h-4 w-4" />
                Start
              </Button>
            </div>
          </div>
        {:else}
          <!-- Default Toolbar -->
          <div class="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <div class="relative w-full max-w-[300px]">
              <Search
                class="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4"
              />
              <Input
                type="search"
                placeholder="Search accounts..."
                class="pl-9"
                bind:value={searchQuery}
              />
            </div>

            <div
              class="flex flex-1 flex-wrap items-center gap-2 sm:justify-end"
            >
              <div
                class="flex items-center gap-2 rounded-lg border p-1 shadow-sm"
              >
                <Select.Root bind:value={managerState.selectedServer}>
                  <Select.Trigger
                    class="h-8 w-[240px] border-0 bg-transparent focus:ring-0"
                  >
                    <div class="text-muted-foreground flex items-center gap-2">
                      <span class="text-foreground text-sm"
                        >{managerState.selectedServer
                          ? managerState.selectedServer.split(" (")[0]
                          : "All Servers"}</span
                      >
                    </div>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value={""}>All Servers</Select.Item>
                    {#each servers.values() as server}
                      <Select.Item value={`${server.sName} (${server.iCount})`}>
                        <span
                          class="flex w-full items-center justify-between gap-4"
                        >
                          <span>{server.sName}</span>
                          <span class="text-muted-foreground text-xs"
                            >{server.iCount}</span
                          >
                        </span>
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>

                <Separator orientation="vertical" class="h-5" />

                <div class="flex items-center gap-2 px-2">
                  <Checkbox
                    id="use-script"
                    bind:checked={managerState.startWithScript}
                  />
                  <label
                    for="use-script"
                    class="text-muted-foreground cursor-pointer text-sm font-medium"
                  >
                    Script
                  </label>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  title={managerState.scriptPath || "Select Script"}
                  disabled={!managerState.startWithScript}
                  onclick={selectScript}
                >
                  <FileCode
                    class="h-4 w-4 {managerState.scriptPath
                      ? 'text-primary'
                      : 'text-muted-foreground'}"
                  />
                </Button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Table Area -->
      <div class="relative flex-1 overflow-auto">
        {#if isLoading}
          <div
            class="text-muted-foreground flex h-full flex-col items-center justify-center gap-4"
          >
            <Loader2 class="text-primary/50 h-8 w-8 animate-spin" />
            <p>Loading accounts...</p>
          </div>
        {:else if filteredAccounts.length === 0}
          <div
            class="flex h-full flex-col items-center justify-center gap-4 py-12 text-center"
          >
            <div class="bg-muted rounded-full p-4">
              <Search class="text-muted-foreground/50 h-8 w-8" />
            </div>
            <div class="space-y-1">
              <h3 class="font-semibold">No accounts found</h3>
              <p class="text-muted-foreground text-sm">
                Try adjusting your filters or add a new account.
              </p>
            </div>
            <Button
              variant="outline"
              onclick={() => {
                searchQuery = "";
                managerState.selectedServer = undefined;
              }}
            >
              Clear Filters
            </Button>
          </div>
        {:else}
          <Table.Root>
            <Table.Body>
              {#each filteredAccounts as account (account.username)}
                {@const isSelected = selectedAccounts.has(
                  account.username.toLowerCase(),
                )}

                <Table.Row
                  class="hover:bg-muted/50 group cursor-pointer transition-colors {isSelected
                    ? 'bg-muted'
                    : ''}"
                  onclick={() => toggleSelection(account.username)}
                >
                  <Table.Cell class="w-[50px]">
                    <Checkbox
                      checked={isSelected}
                      onclick={(e) => e.stopPropagation()}
                      onCheckedChange={() => toggleSelection(account.username)}
                    />
                  </Table.Cell>
                  <Table.Cell class="font-medium">
                    <span class="text-sm font-medium">{account.username}</span>
                  </Table.Cell>
                  <Table.Cell class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        onclick={(e) => {
                          e.stopPropagation();
                          handleStart([account.username]);
                        }}
                      >
                        <Play
                          class="text-muted-foreground hover:text-primary h-4 w-4"
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        onclick={(e) => {
                          e.stopPropagation();
                          editingAccount = account;
                          isEditOpen = true;
                        }}
                      >
                        <Pencil
                          class="text-muted-foreground hover:text-primary h-4 w-4"
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        onclick={(e) => {
                          e.stopPropagation();
                          handleRemove([account.username]);
                        }}
                      >
                        <Trash2
                          class="text-muted-foreground hover:text-destructive h-4 w-4"
                        />
                      </Button>

                      <Menu.Root>
                        <Menu.Trigger>
                          {#snippet child({ props })}
                            <Button
                              variant="ghost"
                              size="icon"
                              class="h-8 w-8"
                              {...props}
                            >
                              <MoreHorizontal
                                class="text-muted-foreground h-4 w-4"
                              />
                            </Button>
                          {/snippet}
                        </Menu.Trigger>
                        <Menu.Content align="end">
                          <Menu.Label>Actions</Menu.Label>
                          <Menu.Item
                            class="text-destructive"
                            onclick={() => handleRemove([account.username])}
                          >
                            <Trash2 class="mr-2 h-4 w-4" /> Delete
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Root>
                    </div>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        {/if}
      </div>

      <!-- Footer Stats -->
      <div
        class="bg-muted/10 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs"
      >
        <div>
          Showing {filteredAccounts.length} of {accounts.size} accounts
        </div>
        <div class="flex gap-4">
          <span
            >Ready to start: {Array.from(accounts.values()).filter(
              (a) => !timeouts.has(a.username.toLowerCase()),
            ).length}</span
          >
          <span>Running: {timeouts.size}</span>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Add Dialog -->
<Dialog.Root bind:open={isAddOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Add Account</Dialog.Title>
      <Dialog.Description>
        Enter the credentials for the new account.
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <label for="username" class="text-right text-sm font-medium">
          Username
        </label>
        <Input
          id="username"
          bind:value={newUsername}
          class="col-span-3"
          placeholder="johndoe"
        />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <label for="password" class="text-right text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          bind:value={newPassword}
          class="col-span-3"
          placeholder="••••••"
        />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <label for="server" class="text-right text-sm font-medium">
          Server
        </label>
        <div class="col-span-3">
          <Select.Root type="single" bind:value={managerState.selectedServer}>
            <Select.Trigger class="w-full">
              {managerState.selectedServer
                ? managerState.selectedServer.split(" (")[0]
                : "Auto Select"}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">Auto Select</Select.Item>
              {#each servers.values() as s}
                <Select.Item value={`${s.sName} (${s.iCount})`}
                  >{s.sName}</Select.Item
                >
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isAddOpen = false)}
        >Cancel</Button
      >
      <Button onclick={handleAddAccount} disabled={!newUsername || !newPassword}
        >Save Account</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<EditAccountModal
  isOpen={isEditOpen}
  account={editingAccount}
  onClose={() => {
    isEditOpen = false;
    editingAccount = null;
  }}
/>
