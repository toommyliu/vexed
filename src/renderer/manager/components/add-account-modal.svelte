<script lang="ts">
  import type { Account } from "../../../common/types";
  import { client } from "../../../shared/tipc";
  import { managerState } from "../state.svelte";

  type Props = {
    isOpen: boolean;
    onClose: () => void;
  };

  const { isOpen, onClose }: Props = $props();

  let username = $state("");
  let password = $state("");
  let isSubmitting = $state(false);
  let error = $state("");

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();

    const cleanUsername = username?.trim()?.toLowerCase();
    const cleanPassword = password?.trim()?.toLowerCase();

    if (!cleanUsername || !cleanPassword) {
      error = "Please fill in all fields";
      return;
    }

    if (managerState.accounts.has(cleanUsername)) {
      error = "An account with this username already exists";
      return;
    }

    isSubmitting = true;
    error = "";

    try {
      const account: Account = {
        username: cleanUsername,
        password: cleanPassword,
      };

      await client.addAccount(account);
      managerState.accounts.set(cleanUsername, account);

      username = "";
      password = "";
      onClose();
    } catch (err) {
      error = "Failed to add account. Please try again.";
      console.error("Failed to add account:", err);
    } finally {
      isSubmitting = false;
    }
  };

  const handleKeydown = (ev: KeyboardEvent) => {
    if (!isOpen) return;
    if (ev.key === "Escape") onClose();
  };

  // Prevent body scroll when modal is open
  $effect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    onclick={onClose}
    onkeydown={(ev) => ev.key === "Enter" && onClose()}
    role="button"
    tabindex="0"
  >
    <div
      class="relative w-full max-w-md rounded-md border border-zinc-700/50 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl"
      onclick={(ev) => ev.stopPropagation()}
      onkeydown={(ev) => ev.key === "Enter" && ev.stopPropagation()}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      tabindex="-1"
    >
      <button
        class="absolute right-4 top-4 bg-transparent text-zinc-400 transition-colors hover:text-white"
        onclick={onClose}
        aria-label="Close modal"
      >
        <svg
          class="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div class="mb-6">
        <h2 id="modal-title" class="text-xl font-semibold text-white">
          Add Account
        </h2>
      </div>

      {#if error}
        <div class="mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <p class="text-sm text-red-400">{error}</p>
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label
            for="modal-username"
            class="block text-sm font-medium text-zinc-300"
          >
            Username
          </label>
          <input
            id="modal-username"
            type="text"
            bind:value={username}
            required
            disabled={isSubmitting}
            placeholder="Enter username"
            class="mt-1 w-full rounded-md border border-zinc-600/50 bg-zinc-950/50 p-2 text-white placeholder-zinc-500 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label
            for="modal-password"
            class="block text-sm font-medium text-zinc-300"
          >
            Password
          </label>
          <input
            id="modal-password"
            type="password"
            bind:value={password}
            required
            disabled={isSubmitting}
            placeholder="Enter password"
            class="mt-1 w-full rounded-md border border-zinc-600/50 bg-zinc-950/50 p-2 text-white placeholder-zinc-500 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          />
        </div>

        <div class="flex space-x-2 pt-4">
          <button
            type="button"
            onclick={onClose}
            disabled={isSubmitting}
            class="flex-1 rounded-md border border-zinc-600/50 bg-zinc-800/50 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !username.trim() || !password.trim()}
            class="flex-1 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
          >
            {#if isSubmitting}
              Adding...
            {:else}
              Add Account
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
