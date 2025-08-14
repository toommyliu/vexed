<script lang="ts">
  import type { Account, AccountWithServer } from "../../../shared/types";
  import { cn } from "../../../shared";
  import { managerState } from "../state.svelte";

  const { account, removeAccount, startAccount, editAccount }: Props = $props();

  let isDisabled = $derived(managerState.timeouts.has(account.username));
  let isSelected = $derived(
    managerState.selectedAccounts.has(account.username),
  );

  const toggleAccount = () => {
    if (managerState.selectedAccounts.has(account.username)) {
      managerState.selectedAccounts.delete(account.username);
    } else {
      managerState.selectedAccounts.add(account.username);
    }
  };

  type Props = {
    account: Account;
    removeAccount: (account: Account) => void | Promise<void>;
    startAccount: (account: AccountWithServer) => void | Promise<void>;
    editAccount?: (account: Account) => void;
  };
</script>

<div
  class="bg-background-secondary group rounded-md border border-zinc-700/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-zinc-600/70 hover:shadow-xl hover:shadow-zinc-900/20"
>
  <div
    class="flex flex-col space-y-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:p-5"
  >
    <div
      class="flex min-w-0 flex-1 items-center space-x-3 sm:space-x-4"
      onclick={toggleAccount}
      onkeydown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          toggleAccount();
        }
      }}
      role="button"
      tabindex="0"
    >
      <input
        type="checkbox"
        class="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-zinc-600 bg-zinc-950 text-emerald-500 transition-colors focus:ring-emerald-500/20 md:mt-1"
        checked={isSelected}
        onchange={toggleAccount}
        title="Select this account"
      />
      <span
        class="min-w-0 flex-1 cursor-pointer select-none overflow-hidden text-ellipsis whitespace-nowrap text-base font-medium text-white transition-colors duration-200 group-hover:text-emerald-100"
        title={account.username}
      >
        {account.username}
      </span>
      {#if editAccount}
        <button
          class="ml-2 flex h-7 w-7 items-center justify-center rounded bg-transparent text-zinc-400 transition-all duration-200 hover:bg-zinc-800/60 hover:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 group-hover:text-zinc-300"
          onclick={(e) => {
            e.stopPropagation();
            editAccount(account);
          }}
          onkeydown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              editAccount(account);
            }
          }}
          tabindex="0"
          title="Edit this account"
          aria-label="Edit Account"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      {/if}
    </div>
    <div class="flex flex-shrink-0 items-center space-x-2 sm:w-auto">
      <button
        class="flex-shrink-0 rounded-md border border-red-600/50 bg-red-900/30 px-2 py-1.5 text-xs font-medium text-red-200 shadow-md transition-all duration-200 hover:bg-red-800/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 sm:min-w-[70px] sm:px-3 sm:text-sm"
        onclick={() => removeAccount(account)}
        title="Remove this account">Remove</button
      >
      <button
        class={cn(
          "flex-shrink-0 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-2 py-1.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:min-w-[70px] sm:px-3 sm:text-sm",
          isDisabled && "pointers-events-none cursor-not-allowed opacity-50",
          !isDisabled && "hover:bg-emerald-500/80",
        )}
        disabled={isDisabled}
        onclick={async () => {
          await startAccount({
            ...account,
            server: managerState.selectedServer || null,
          });
        }}
        title="Start this account">Start</button
      >
    </div>
  </div>
</div>
