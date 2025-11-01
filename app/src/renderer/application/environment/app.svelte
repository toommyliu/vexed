<script lang="ts">
  import log from "electron-log";
  import { onMount } from "svelte";
  import { normalizeId } from "@game/util/normalizeId";
  import { cn } from "@shared/cn";
  import { client, handlers } from "@shared/tipc";
  import type { EnvironmentState } from "@shared/types";

  const logger = log.scope("app/environment");

  let questInput = $state("");
  let dropInput = $state("");
  let boostInput = $state("");
  let questIds = $state<number[]>([]);
  let dropItems = $state<string[]>([]);
  let boostItems = $state<string[]>([]);
  let rejectElse = $state(false);
  let autoRegisterRequirements = $state(false);
  let autoRegisterRewards = $state(false);
  let isSyncing = $state(false);
  let pendingSync = false;

  function areArraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((value, idx) => value === b[idx]);
  }

  function shouldUpdateState(state: EnvironmentState): boolean {
    const normalizedQuestIds = [...state.questIds].sort((a, b) => a - b);

    const dedupDrops = new Map<string, string>();
    for (const item of state.itemNames) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();
      if (!dedupDrops.has(lower)) dedupDrops.set(lower, trimmed);
    }

    const normalizedDrops = Array.from(dedupDrops.values()).sort((a, b) =>
      a.localeCompare(b),
    );

    const dedupBoosts = new Map<string, string>();
    for (const boost of state.boosts) {
      const trimmed = boost.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();
      if (!dedupBoosts.has(lower)) dedupBoosts.set(lower, trimmed);
    }

    const normalizedBoosts = Array.from(dedupBoosts.values()).sort((a, b) =>
      a.localeCompare(b),
    );

    const normalizedRejectElse = Boolean(state.rejectElse);

    const isSame =
      areArraysEqual(questIds, normalizedQuestIds) &&
      areArraysEqual(dropItems, normalizedDrops) &&
      areArraysEqual(boostItems, normalizedBoosts) &&
      rejectElse === normalizedRejectElse &&
      autoRegisterRequirements === state.autoRegisterRequirements &&
      autoRegisterRewards === state.autoRegisterRewards;

    if (isSame) return false;

    questIds = normalizedQuestIds;
    dropItems = normalizedDrops;
    boostItems = normalizedBoosts;
    rejectElse = normalizedRejectElse;
    autoRegisterRequirements = state.autoRegisterRequirements;
    autoRegisterRewards = state.autoRegisterRewards;

    return true;
  }

  function normalizePayload(
    questIds: number[],
    dropItems: string[],
    boostItems: string[],
    rejectElse: boolean,
    autoRegisterRequirements: boolean,
    autoRegisterRewards: boolean,
  ) {
    const normalizedQuestIds = [...questIds].sort((a, b) => a - b);

    const dedupDrops = new Map<string, string>();
    for (const item of dropItems) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();
      if (!dedupDrops.has(lower)) dedupDrops.set(lower, trimmed);
    }

    const normalizedDrops = Array.from(dedupDrops.values()).sort((a, b) =>
      a.localeCompare(b),
    );

    const dedupBoosts = new Map<string, string>();
    for (const boost of boostItems) {
      const trimmed = boost.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (!dedupBoosts.has(lower)) dedupBoosts.set(lower, trimmed);
    }

    const normalizedBoosts = Array.from(dedupBoosts.values()).sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      questIds: normalizedQuestIds,
      itemNames: normalizedDrops,
      boosts: normalizedBoosts,
      rejectElse: Boolean(rejectElse),
      autoRegisterRequirements,
      autoRegisterRewards,
    };
  }

  async function initializeState() {
    try {
      const state = await client.environment.getState();
      void shouldUpdateState(state);
    } catch (error) {
      logger.error("Failed to load environment state.", error);
    }
  }

  async function syncEnvironment() {
    if (isSyncing) {
      pendingSync = true;
      return;
    }

    const payload = normalizePayload(
      questIds,
      dropItems,
      boostItems,
      rejectElse,
      autoRegisterRequirements,
      autoRegisterRewards,
    );

    isSyncing = true;
    try {
      await client.environment.updateState(payload);
    } catch (error) {
      logger.error("Failed to sync environment state.", error);
    } finally {
      isSyncing = false;
      if (pendingSync) {
        pendingSync = false;
        void syncEnvironment(); // retry again
      }
    }
  }

  function addQuestFromInput() {
    const tokens = questInput
      .split(/[\s,]+/u)
      .map((token) => token.trim())
      .filter(Boolean);

    if (!tokens.length) {
      questInput = "";
      return;
    }

    const current = new Set(questIds);
    let added = false;

    for (const token of tokens) {
      const parsed = normalizeId(token);
      if (parsed === null || parsed === -1) continue;
      if (!current.has(parsed)) {
        current.add(parsed);
        added = true;
      }
    }

    if (!added) {
      return;
    }

    questInput = "";
    questIds = Array.from(current).sort((a, b) => a - b);
    void syncEnvironment();
  }

  function handleQuestSubmit(ev: Event) {
    ev.preventDefault();
    addQuestFromInput();
  }

  function removeQuest(id: number) {
    if (!questIds.length) return;

    const next = questIds.filter((value) => value !== id);
    if (next.length === questIds.length) return;

    questIds = next;
    void syncEnvironment();
  }

  function clearQuests() {
    if (!questIds.length) return;

    questIds = [];
    void syncEnvironment();
  }

  function addDropFromInput() {
    const tokens = dropInput
      .split(/[\n,]+/u)
      .map((token) => token.trim())
      .filter(Boolean);

    dropInput = "";

    if (!tokens.length) return;

    const lowerSet = new Set(dropItems.map((item) => item.toLowerCase()));
    const next = [...dropItems];
    let added = false;

    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (lowerSet.has(lower)) continue;

      lowerSet.add(lower);
      next.push(token);
      added = true;
    }

    if (!added) {
      return;
    }

    next.sort((a, b) => a.localeCompare(b));
    dropItems = next;
    void syncEnvironment();
  }

  function handleDropSubmit(ev: Event) {
    ev.preventDefault();
    addDropFromInput();
  }

  function removeDrop(item: string) {
    if (!dropItems.length) return;

    const next = dropItems.filter((value) => value !== item);
    if (next.length === dropItems.length) return;

    dropItems = next;
    void syncEnvironment();
  }

  function clearDrops() {
    if (!dropItems.length) return;

    dropItems = [];
    void syncEnvironment();
  }

  function updateRejectElse(checked: boolean) {
    if (rejectElse === checked) return;

    rejectElse = checked;
    void syncEnvironment();
  }

  function addBoostFromInput() {
    const tokens = boostInput
      .split(/[\n,]+/u)
      .map((token) => token.trim())
      .filter(Boolean);

    boostInput = "";

    if (!tokens.length) return;

    const lowerSet = new Set(boostItems.map((item) => item.toLowerCase()));
    const next = [...boostItems];
    let added = false;

    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (lowerSet.has(lower)) continue;
      lowerSet.add(lower);
      next.push(token);
      added = true;
    }

    if (!added) {
      return;
    }

    next.sort((a, b) => a.localeCompare(b));
    boostItems = next;
    void syncEnvironment();
  }

  function handleBoostSubmit(ev: Event) {
    ev.preventDefault();
    addBoostFromInput();
  }

  function removeBoost(boost: string) {
    if (!boostItems.length) return;

    const next = boostItems.filter((value) => value !== boost);
    if (next.length === boostItems.length) return;

    boostItems = next;
    void syncEnvironment();
  }

  function clearBoosts() {
    if (!boostItems.length) return;

    boostItems = [];
    void syncEnvironment();
  }

  async function grabBoosts() {
    try {
      const grabbedBoosts = await client.environment.grabBoosts();
      const current = new Set(boostItems);
      let added = false;
      for (const boost of grabbedBoosts) {
        if (!current.has(boost)) {
          current.add(boost);
          added = true;
        }
      }
      if (added) {
        boostItems = Array.from(current).sort((a, b) => a.localeCompare(b));
        void syncEnvironment();
      }
    } catch (error) {
      logger.error("Failed to grab boosts.", error);
    }
  }

  function updateAutoRegisterRequirements(checked: boolean) {
    if (autoRegisterRequirements === checked) return;

    autoRegisterRequirements = checked;
    void syncEnvironment();
  }

  function updateAutoRegisterRewards(checked: boolean) {
    if (autoRegisterRewards === checked) return;

    autoRegisterRewards = checked;
    void syncEnvironment();
  }

  onMount(() => {
    void initializeState();

    // for (let i = 0; i < 1000; i++) {
    //   const randomId = Math.floor(Math.random() * 10000) + 1;
    //   if (!questIds.includes(randomId))
    //   questIds = [...questIds, randomId].sort((a, b) => a - b);
    // }

    void syncEnvironment();
  });

  handlers.environment.stateChanged.listen((state) => {
    void shouldUpdateState(state);
  });
</script>

<main
  class="m-0 flex min-h-screen flex-col overflow-hidden bg-background-primary text-white focus:outline-none"
>
  <div class="flex flex-1 flex-col overflow-y-auto py-6">
    <div class="mx-auto w-full max-w-5xl space-y-6 px-3 sm:px-6">
      <div
        class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-8"
      >
        <section
          class="flex max-h-96 flex-col rounded-md border border-gray-800/50 bg-background-secondary p-4 backdrop-blur-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-medium text-white">Quests</h2>
            </div>
            {#if questIds.length}
              <button
                type="button"
                class="rounded bg-transparent text-xs font-medium text-blue-400 transition duration-150 hover:text-blue-300 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                onclick={clearQuests}
                disabled={isSyncing}
              >
                Clear all
              </button>
            {/if}
          </div>

          <form
            class="mt-6 flex flex-shrink-0 items-center space-x-2"
            onsubmit={handleQuestSubmit}
          >
            <input
              type="text"
              bind:value={questInput}
              class="flex-1 rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs text-white placeholder-gray-500 shadow-inner transition-all duration-200 focus:bg-gray-800/70 focus:outline-none"
            />
            <button
              type="submit"
              class={cn(
                "rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs font-medium text-white shadow-md transition duration-200 hover:bg-gray-700/50 hover:shadow-lg",
                (isSyncing || !questInput.trim()) &&
                  "pointer-events-none cursor-not-allowed opacity-50",
              )}
              disabled={isSyncing || !questInput.trim()}
            >
              Add
            </button>
          </form>

          <div class="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto">
            <div class="flex flex-wrap">
              {#if questIds.length}
                {#each questIds as questId (questId)}
                  <span
                    class="group mb-2 mr-2 inline-flex items-center space-x-2 rounded-full border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs"
                  >
                    <span class="font-medium text-gray-200">{questId}</span>
                    <button
                      type="button"
                      class="flex h-4 w-4 items-center justify-center rounded-full bg-transparent leading-none text-gray-400 transition duration-150 hover:bg-gray-700/50 hover:text-red-400"
                      onclick={() => removeQuest(questId)}
                      disabled={isSyncing}
                    >
                      ×
                    </button>
                  </span>
                {/each}
              {/if}
            </div>
          </div>

          <div
            class="mt-6 flex flex-shrink-0 flex-col space-y-3 md:flex-row md:space-x-3 md:space-y-0 border-t border-gray-800/40 pt-4"
          >
            <label class="flex items-center space-x-2 text-xs text-gray-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-700/50 bg-gray-800/50 text-blue-500 shadow-inner focus:ring-2 focus:ring-blue-500/20"
                checked={autoRegisterRequirements}
                disabled={isSyncing}
                onchange={(ev) =>
                  updateAutoRegisterRequirements(
                    (ev.target as HTMLInputElement).checked,
                  )}
                title="Automatically adds all quest-required items to the drop list when a quest is added."
              />
              <span class="whitespace-nowrap">Auto register requirements</span>
            </label>
            <label class="flex items-center space-x-2 text-xs text-gray-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-700/50 bg-gray-800/50 text-blue-500 shadow-inner focus:ring-2 focus:ring-blue-500/20"
                checked={autoRegisterRewards}
                disabled={isSyncing}
                onchange={(ev) =>
                  updateAutoRegisterRewards(
                    (ev.target as HTMLInputElement).checked,
                  )}
                title="Automatically adds all quest reward items to the drop list when a quest is added."
              />
              <span class="whitespace-nowrap">Auto register rewards</span>
            </label>
          </div>
        </section>

        <section
          class="flex max-h-96 flex-col rounded-md border border-gray-800/50 bg-background-secondary p-4 backdrop-blur-sm"
        >
          <div class="flex flex-shrink-0 items-center justify-between">
            <div>
              <h2 class="text-lg font-medium text-white">Drops</h2>
            </div>
            {#if dropItems.length}
              <button
                type="button"
                class="rounded bg-transparent text-xs font-medium text-blue-400 transition duration-150 hover:text-blue-300 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                onclick={clearDrops}
                disabled={isSyncing}
              >
                Clear all
              </button>
            {/if}
          </div>

          <form
            class="mt-6 flex flex-shrink-0 items-center space-x-2"
            onsubmit={handleDropSubmit}
          >
            <input
              type="text"
              bind:value={dropInput}
              class="flex-1 rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs text-white placeholder-gray-500 shadow-inner transition-all duration-200 focus:bg-gray-800/70 focus:outline-none"
              autocomplete="off"
              spellcheck={false}
            />
            <button
              type="submit"
              class={cn(
                "rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs font-medium text-white shadow-md transition duration-200 hover:bg-gray-700/50 hover:shadow-lg",
                (isSyncing || !dropInput.trim()) &&
                  "pointer-events-none cursor-not-allowed opacity-50",
              )}
              disabled={isSyncing || !dropInput.trim()}
            >
              Add
            </button>
          </form>

          <div class="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto">
            <div class="flex flex-wrap">
              {#if dropItems.length}
                {#each dropItems as drop (drop)}
                  <span
                    class="group mb-2 mr-2 inline-flex items-center space-x-2 rounded-full border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs"
                  >
                    <span class="font-medium text-gray-200">{drop}</span>
                    <button
                      type="button"
                      class="flex h-4 w-4 items-center justify-center rounded-full bg-transparent leading-none text-gray-400 transition duration-150 hover:bg-gray-700/50 hover:text-red-400"
                      onclick={() => removeDrop(drop)}
                      disabled={isSyncing}
                    >
                      ×
                    </button>
                  </span>
                {/each}
              {/if}
            </div>
          </div>

          <div
            class="mt-6 flex flex-shrink-0 flex-wrap items-center justify-between space-x-3 space-y-3 border-t border-gray-800/40 pt-4"
          >
            <label class="flex items-center space-x-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={rejectElse}
                disabled={isSyncing}
                class="h-4 w-4 rounded border-gray-700/50 bg-gray-800/50 text-blue-500 shadow-inner focus:ring-2 focus:ring-blue-500/20"
                onchange={(ev) =>
                  updateRejectElse((ev.target as HTMLInputElement).checked)}
              />
              <span>Reject else</span>
            </label>
          </div>
        </section>

        <section
          class="flex max-h-96 flex-col rounded-md border border-gray-800/50 bg-background-secondary p-4 backdrop-blur-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-medium text-white">Boosts</h2>
            </div>
            <div class="flex space-x-2">
              <button
                type="button"
                class={cn(
                  "rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs font-medium text-white shadow-md transition duration-200 hover:bg-gray-700/50 hover:shadow-lg",
                  isSyncing &&
                    "pointer-events-none cursor-not-allowed opacity-50",
                )}
                onclick={grabBoosts}
                disabled={isSyncing}
              >
                Grab
              </button>
              {#if boostItems.length}
                <button
                  type="button"
                  class="rounded bg-transparent text-xs font-medium text-blue-400 transition duration-150 hover:text-blue-300 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  onclick={clearBoosts}
                  disabled={isSyncing}
                >
                  Clear all
                </button>
              {/if}
            </div>
          </div>

          <form
            class="mt-6 flex flex-shrink-0 items-center space-x-2"
            onsubmit={handleBoostSubmit}
          >
            <input
              type="text"
              bind:value={boostInput}
              class="flex-1 rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs text-white placeholder-gray-500 shadow-inner transition-all duration-200 focus:bg-gray-800/70 focus:outline-none"
              autocomplete="off"
              spellcheck={false}
            />
            <button
              type="submit"
              class={cn(
                "rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs font-medium text-white shadow-md transition duration-200 hover:bg-gray-700/50 hover:shadow-lg",
                (isSyncing || !boostInput.trim()) &&
                  "pointer-events-none cursor-not-allowed opacity-50",
              )}
              disabled={isSyncing || !boostInput.trim()}
            >
              Add
            </button>
          </form>

          <div class="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto">
            <div class="flex flex-wrap">
              {#if boostItems.length}
                {#each boostItems as boost (boost)}
                  <span
                    class="group mb-2 mr-2 inline-flex items-center space-x-2 rounded-full border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-xs"
                  >
                    <span class="font-medium text-gray-200">{boost}</span>
                    <button
                      type="button"
                      class="flex h-4 w-4 items-center justify-center rounded-full bg-transparent leading-none text-gray-400 transition duration-150 hover:bg-gray-700/50 hover:text-red-400"
                      onclick={() => removeBoost(boost)}
                      disabled={isSyncing}
                    >
                      ×
                    </button>
                  </span>
                {/each}
              {/if}
            </div>
          </div>

          <div class="mt-6 flex-shrink-0"></div>
        </section>
      </div>
    </div>
  </div>
</main>
