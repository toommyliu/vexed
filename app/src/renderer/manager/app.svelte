<script lang="ts">
  import {
    Plus,
    Search,
    Trash2,
    Play,
    Server as ServerIcon,
    FileCode,
    Pencil,
    Loader,
    ToggleLeft,
    CheckSquare,
    Square,
  } from "lucide-svelte";

  import { Button, Input, Checkbox, Switch, cn } from "@vexed/ui";
  import * as Dialog from "@vexed/ui/Dialog";
  import * as Select from "@vexed/ui/Select";

  import { onMount } from "svelte";

  import { managerState } from "./state.svelte";
  import { removeAccount, startAccount } from "./util";
  import { client } from "../../shared/tipc";
  import type { Account } from "../../shared/types";
  import EditAccountModal from "./components/edit-account-modal.svelte";

  const { accounts, servers, selectedAccounts } = managerState;

  let searchQuery = $state("");
  let isLoading = $state(true);

  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  let editingAccount = $state<Account | null>(null);

  let newUsername = $state("");
  let newPassword = $state(""); 

  let filteredAccounts = $derived(
    Array.from(accounts.values()).filter((acc) => {
      return acc.username.toLowerCase().includes(searchQuery.toLowerCase());
    }),
  );

  let selectedCount = $derived(selectedAccounts.size);
  let isAllSelected = $derived(
    filteredAccounts.length > 0 &&
      filteredAccounts.every((a) =>
        selectedAccounts.has(a.username.toLowerCase()),
      ),
  );

  onMount(async () => {
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
      if (i === 0) 
        managerState.selectedServer = `${server.sName} (${server.iCount})`;
      
      servers.set(server.sName, server);
    }

    isLoading = false;
  });

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

  async function handleAddAccount() {
    if (!newUsername || !newPassword) return;
    const key = newUsername.toLowerCase();
    if (accounts.has(key)) {
      return;
    }

    const newAccount: Account = {
      username: newUsername,
      password: newPassword,
    };

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

<div class="bg-background flex h-screen flex-col">
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b border-border/50 px-6 py-3 backdrop-blur-xl elevation-1"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <div>
          <h1 class="text-foreground text-base font-semibold tracking-tight">
            Account Manager
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button size="sm" class="gap-2" onclick={() => (isAddOpen = true)}>
          <Plus class="h-4 w-4" />
          <span class="hidden sm:inline">Add Account</span>
        </Button>
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-hidden p-4 sm:p-6">
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-3">
      <div class="flex flex-col gap-3">
        <div class="relative">
          <Search
            class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
          />
          <Input
            type="search"
            placeholder="Search accounts..."
            class="pl-10 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
            bind:value={searchQuery}
          />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select.Root bind:value={managerState.selectedServer}>
            <Select.Trigger class="w-full bg-secondary/50 border-border/50 hover:bg-secondary transition-colors">
              <div class="flex items-center gap-2">
                <ServerIcon class="text-muted-foreground h-4 w-4 shrink-0" />
                <span class="text-foreground text-sm truncate"
                  >{managerState.selectedServer?.split(" (")?.[0] ?? ""}</span
                >
              </div>
            </Select.Trigger>
            <Select.Content>
              {#each servers.values() as server}
                <Select.Item value={`${server.sName} (${server.iCount})`}>
                  <span
                    class="flex w-full items-center justify-between gap-4"
                  >
                    <span>{server.sName}</span>
                    <span class="text-muted-foreground text-xs tabular-nums"
                      >{server.iCount}</span
                    >
                  </span>
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>

          <div
            class="group relative flex items-stretch overflow-hidden rounded-lg border transition-all duration-200
              {managerState.startWithScript
                ? 'border-primary/40 bg-primary/5 elevation-1'
                : 'border-border/50 bg-secondary/50'}"
          >
            <label
              class="flex items-center gap-2 px-3 bg-transparent hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <Switch
                bind:checked={managerState.startWithScript}
                class="h-4 w-8 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-4"
              />
              <span
                class="text-sm font-medium select-none whitespace-nowrap transition-colors
                  {managerState.startWithScript ? 'text-foreground' : 'text-muted-foreground'}"
              >
                Script
              </span>
            </label>

            <div
              class="w-px self-stretch my-1.5 transition-colors
                {managerState.startWithScript ? 'bg-primary/20' : 'bg-border/30'}"
            ></div>

            <button
              type="button"
              onclick={selectScript}
              class="flex flex-1 items-center gap-2 px-3 min-w-0 bg-transparent hover:bg-secondary/80 transition-colors cursor-pointer"
              title={managerState.scriptPath || "Select a script file"}
            >
              <FileCode
                class={cn("h-4 w-4 shrink-0 transition-colors", managerState.scriptPath ? 'text-primary' : 'text-muted-foreground')}
              />
              <span
                class="truncate text-sm transition-colors
                  {managerState.scriptPath ? 'text-foreground font-medium' : 'text-muted-foreground'}"
              >
                {managerState.scriptPath
                  ? managerState.scriptPath.split(/[/\\]/).pop()
                  : "Choose file..."}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between text-sm transition-all duration-200"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex items-center gap-1.5 text-muted-foreground transition-colors"
          >
            <span class="tabular-nums font-medium {selectedCount > 0 ? 'text-primary' : ''}"
              >{selectedCount}</span
            >
            <span class="text-muted-foreground/70">of</span>
            <span class="tabular-nums">{filteredAccounts.length}</span>
            <span class="text-muted-foreground/70">selected</span>
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            onclick={toggleAll}
            class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-muted-foreground transition-all duration-150 hover:bg-secondary hover:text-foreground active:scale-95"
            title={isAllSelected ? "Deselect all" : "Select all"}
          >
            {#if isAllSelected}
              <Square class="h-4 w-4" />
            {:else}
              <CheckSquare class="h-4 w-4" />
            {/if}
            <span class="text-sm font-medium">{isAllSelected ? "None" : "All"}</span>
          </button>

          <div class="h-4 w-px bg-border/30"></div>

          <button
            type="button"
            onclick={toggleSelected}
            class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-muted-foreground transition-all duration-150 hover:bg-secondary hover:text-foreground active:scale-95"
            title="Invert selection"
          >
            <ToggleLeft class="h-4 w-4" />
            <span class="text-sm font-medium">Invert</span>
          </button>

          <div class="h-4 w-px bg-border/30 ml-1"></div>

          <button
            type="button"
            onclick={() => handleRemove(Array.from(selectedAccounts))}
            disabled={selectedCount === 0}
            class="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-150 ml-1
              {selectedCount > 0 
                ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 cursor-pointer' 
                : 'text-muted-foreground/40 cursor-not-allowed'}"
            title="Remove selected"
          >
            <Trash2 class="h-4 w-4" />
            <span class="text-sm font-medium">Remove</span>
          </button>

          <button
            type="button"
            onclick={() => handleStart(Array.from(selectedAccounts))}
            disabled={selectedCount === 0}
            class="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-150 ml-1
              {selectedCount > 0 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 cursor-pointer' 
                : 'bg-primary/30 text-primary-foreground/50 cursor-not-allowed'}"
            title="Start selected"
          >
            <Play class="h-4 w-4" />
            <span class="text-sm font-medium">Start</span>
          </button>
        </div>
      </div>

      <div class="relative flex-1 overflow-auto -mx-1 px-1">
        {#if isLoading}
          <div
            class="text-muted-foreground flex h-full flex-col items-center justify-center gap-3"
          >
            <Loader class="text-primary h-6 w-6 animate-spin" />
            <p class="text-sm">Loading accounts...</p>
          </div>
        {:else if filteredAccounts.length === 0}
          <div
            class="flex h-full flex-col items-center justify-center gap-4 py-12 text-center"
          >
            <div class="bg-secondary/50 rounded-full p-4">
              <Search class="text-muted-foreground h-6 w-6" />
            </div>
            <div class="space-y-1">
              <h3 class="text-foreground font-medium">No accounts found</h3>
              <p class="text-muted-foreground text-sm">
                Try adjusting your filters or add a new account.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="border-border/50"
              onclick={() => {
                searchQuery = "";
                managerState.selectedServer = undefined;
              }}
            >
              Clear Filters
            </Button>
          </div>
        {:else}
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each filteredAccounts as account, index (account.username)}
              {@const isSelected = selectedAccounts.has(
                account.username.toLowerCase(),
              )}

              <div
                class="group flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-4 transition-all duration-150
                  {isSelected
                    ? 'border-primary/50 bg-primary/5 elevation-2'
                    : 'border-border/50 bg-card hover:border-border hover:bg-secondary/30 hover:elevation-1'}"
                onclick={() => toggleSelection(account.username)}
                role="button"
                tabindex="0"
                onkeydown={(e: KeyboardEvent) =>
                  e.key === "Enter" && toggleSelection(account.username)}
              >
                <Checkbox
                  checked={isSelected}
                  onclick={(e: MouseEvent) => e.stopPropagation()}
                  onCheckedChange={() => toggleSelection(account.username)}
                />

                <!-- DO NOT CHANGE THIS!!! -->
                <span
                  class="text-foreground flex-1 truncate text-base font-medium"
                  >Account {index + 1}</span
                >

                <!-- Card Actions -->
                <div
                  class="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleStart([account.username]);
                    }}
                  >
                    <Play class="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      editingAccount = account;
                      isEditOpen = true;
                    }}
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleRemove([account.username]);
                    }}
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </main>


</div>

<Dialog.Root bind:open={isAddOpen}>
  <Dialog.Content class="elevation-3">
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
