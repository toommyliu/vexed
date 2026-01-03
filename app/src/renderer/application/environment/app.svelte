<script lang="ts">
  import { Button, Checkbox, Input, Label } from "@vexed/ui";
  import log from "electron-log";
  import { onMount } from "svelte";

  import Plus from "lucide-svelte/icons/plus";
  import X from "lucide-svelte/icons/x";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import Scroll from "lucide-svelte/icons/scroll";
  import Package from "lucide-svelte/icons/package";
  import Zap from "lucide-svelte/icons/zap";
  import Download from "lucide-svelte/icons/download";
  import Share2 from "lucide-svelte/icons/share-2";

  import { normalizeId } from "~/game/util/normalizeId";
  import { client, handlers } from "~/shared/tipc";
  import type { EnvironmentState } from "~/shared/types";

  const logger = log.scope("app/environment");

  let questInput = $state("");
  let dropInput = $state("");
  let boostInput = $state("");
  let questIds = $state<number[]>([]);
  let questItemIds = $state<Record<number, number>>({});
  let dropItems = $state<string[]>([]);
  let boostItems = $state<string[]>([]);
  let rejectElse = $state(false);
  let autoRegisterRequirements = $state(false);
  let autoRegisterRewards = $state(false);
  let isSyncing = $state(false);
  let isBroadcasting = $state(false);
  let pendingSync = false;

  function areArraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((value, idx) => value === b[idx]);
  }

  function areRecordsEqual(a: Record<number, number>, b: Record<number, number>): boolean {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => a[Number(key)] === b[Number(key)]);
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
      a.localeCompare(b)
    );

    const dedupBoosts = new Map<string, string>();
    for (const boost of state.boosts) {
      const trimmed = boost.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();
      if (!dedupBoosts.has(lower)) dedupBoosts.set(lower, trimmed);
    }

    const normalizedBoosts = Array.from(dedupBoosts.values()).sort((a, b) =>
      a.localeCompare(b)
    );

    const normalizedRejectElse = Boolean(state.rejectElse);
    const normalizedQuestItemIds = state.questItemIds ?? {};

    const isSame =
      areArraysEqual(questIds, normalizedQuestIds) &&
      areRecordsEqual(questItemIds, normalizedQuestItemIds) &&
      areArraysEqual(dropItems, normalizedDrops) &&
      areArraysEqual(boostItems, normalizedBoosts) &&
      rejectElse === normalizedRejectElse &&
      autoRegisterRequirements === state.autoRegisterRequirements &&
      autoRegisterRewards === state.autoRegisterRewards;

    if (isSame) return false;

    questIds = normalizedQuestIds;
    questItemIds = normalizedQuestItemIds;
    dropItems = normalizedDrops;
    boostItems = normalizedBoosts;
    rejectElse = normalizedRejectElse;
    autoRegisterRequirements = state.autoRegisterRequirements;
    autoRegisterRewards = state.autoRegisterRewards;

    return true;
  }

  function normalizePayload(
    questIds: number[],
    questItemIds: Record<number, number>,
    dropItems: string[],
    boostItems: string[],
    rejectElse: boolean,
    autoRegisterRequirements: boolean,
    autoRegisterRewards: boolean
  ) {
    const normalizedQuestIds = [...questIds].sort((a, b) => a - b);
    const questIdSet = new Set(normalizedQuestIds);

    // Filter questItemIds to only include valid quest IDs
    const normalizedQuestItemIds: Record<number, number> = {};
    for (const [questIdStr, itemId] of Object.entries(questItemIds)) {
      const questId = Number(questIdStr);
      if (questIdSet.has(questId)) {
        normalizedQuestItemIds[questId] = itemId;
      }
    }

    const dedupDrops = new Map<string, string>();
    for (const item of dropItems) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();
      if (!dedupDrops.has(lower)) dedupDrops.set(lower, trimmed);
    }

    const normalizedDrops = Array.from(dedupDrops.values()).sort((a, b) =>
      a.localeCompare(b)
    );

    const dedupBoosts = new Map<string, string>();
    for (const boost of boostItems) {
      const trimmed = boost.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (!dedupBoosts.has(lower)) dedupBoosts.set(lower, trimmed);
    }

    const normalizedBoosts = Array.from(dedupBoosts.values()).sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      questIds: normalizedQuestIds,
      questItemIds: normalizedQuestItemIds,
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
      questItemIds,
      dropItems,
      boostItems,
      rejectElse,
      autoRegisterRequirements,
      autoRegisterRewards
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
        void syncEnvironment();
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
    const newItemIds = { ...questItemIds };
    let added = false;

    for (const token of tokens) {
      const colonIndex = token.indexOf(":");
      let questIdPart: string;
      let itemIdPart: string | undefined;

      if (colonIndex !== -1) {
        questIdPart = token.slice(0, colonIndex);
        itemIdPart = token.slice(colonIndex + 1);
      } else {
        questIdPart = token;
      }

      const parsed = normalizeId(questIdPart);
      if (parsed === null || parsed === -1) continue;

      if (!current.has(parsed)) {
        current.add(parsed);
        added = true;
      }

      if (itemIdPart) {
        const itemId = Number(itemIdPart);
        if (!Number.isNaN(itemId) && itemId > 0) {
          newItemIds[parsed] = itemId;
          added = true;
        }
      }
    }

    if (!added) {
      return;
    }

    questInput = "";
    questIds = Array.from(current).sort((a, b) => a - b);
    questItemIds = newItemIds;
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
    // Also remove from questItemIds
    const { [id]: _, ...rest } = questItemIds;
    questItemIds = rest;
    void syncEnvironment();
  }

  function clearQuests() {
    if (!questIds.length) return;

    questIds = [];
    questItemIds = {};
    void syncEnvironment();
  }

  function updateQuestItemId(questId: number, itemIdStr: string) {
    const itemId = Number(itemIdStr);
    if (!itemIdStr || Number.isNaN(itemId) || itemId <= 0) {
      // Clear the item ID if empty or invalid
      const { [questId]: _, ...rest } = questItemIds;
      questItemIds = rest;
    } else {
      questItemIds = { ...questItemIds, [questId]: itemId };
    }
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
  });

  handlers.game.gameReloaded.listen(() => {
    questInput = "";
    dropInput = "";
    boostInput = "";
    questIds = [];
    questItemIds = {};
    dropItems = [];
    boostItems = [];
    rejectElse = false;
    autoRegisterRequirements = false;
    autoRegisterRewards = false;
    isSyncing = false;
    pendingSync = false;
    void syncEnvironment();
  });

  handlers.environment.stateChanged.listen((state) => {
    void shouldUpdateState(state);
  });

  async function broadcastToAll() {
    if (isBroadcasting) return;

    const payload = normalizePayload(
      questIds,
      questItemIds,
      dropItems,
      boostItems,
      rejectElse,
      autoRegisterRequirements,
      autoRegisterRewards
    );

    isBroadcasting = true;
    try {
      await client.environment.broadcastState(payload);
    } catch (error) {
      logger.error("Failed to broadcast environment state.", error);
    } finally {
      isBroadcasting = false;
    }
  }
</script>

<div class="bg-background flex h-screen flex-col">
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b border-border/50 px-6 py-3 backdrop-blur-xl elevation-1"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-foreground text-base font-semibold tracking-tight">
          Environment
        </h1>
      </div>
      <Button
        variant="outline"
        size="sm"
        class="h-7 gap-1.5 text-xs border-border/50"
        onclick={broadcastToAll}
        disabled={isBroadcasting || isSyncing}
      >
        <Share2 class="h-3.5 w-3.5" />
        Sync to all
      </Button>
    </div>
  </header>

  <main class="flex-1 overflow-auto p-4 sm:p-6">
    <div class="mx-auto max-w-7xl">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <section class="flex flex-col rounded-xl border border-border/50 bg-card">
          <div class="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div class="flex items-center gap-2">
              <Scroll class="h-4 w-4 text-muted-foreground" />
              <h2 class="text-sm font-semibold text-foreground">Quests</h2>
              {#if questIds.length > 0}
                <span class="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {questIds.length}
                </span>
              {/if}
            </div>
            {#if questIds.length > 0}
              <Button
                variant="ghost"
                size="sm"
                class="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                onclick={clearQuests}
                disabled={isSyncing}
              >
                <Trash2 class="h-3.5 w-3.5" />
                Clear
              </Button>
            {/if}
          </div>

          <div class="flex flex-col gap-3 p-4">
            <form class="flex items-center gap-2" onsubmit={handleQuestSubmit}>
              <Input
                type="text"
                placeholder="Enter quest ID..."
                bind:value={questInput}
                class="flex-1 bg-secondary/50 border-border/50"
              />
              <Button
                type="submit"
                size="sm"
                class="gap-1.5"
                disabled={isSyncing || !questInput.trim()}
              >
                <Plus class="h-4 w-4" />
                Add
              </Button>
            </form>

            <div class="min-h-[80px] max-h-32 overflow-y-auto">
              {#if questIds.length === 0}
                <div class="flex h-20 items-center justify-center">
                  <span class="text-xs text-muted-foreground/70">No quests registered</span>
                </div>
              {:else}
                <div class="flex flex-wrap gap-1.5">
                  {#each questIds as questId (questId)}
                    <span
                      class="group inline-flex items-center gap-1 rounded-full border border-border/50 bg-secondary/50 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      <span class="tabular-nums">{questId}</span>
                      {#if questItemIds[questId] !== undefined}
                        <span class="text-muted-foreground">:</span>
                        <input
                          type="number"
                          class="w-14 bg-transparent border-none outline-none text-xs tabular-nums text-foreground [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={String(questItemIds[questId])}
                          onblur={(ev) => updateQuestItemId(questId, ev.currentTarget.value)}
                          onkeydown={(ev) => {
                            if (ev.key === "Enter") {
                              ev.currentTarget.blur();
                            }
                          }}
                          disabled={isSyncing}
                        />
                      {:else}
                        <input
                          type="text"
                          class="w-12 bg-transparent border-none outline-none text-xs tabular-nums text-foreground placeholder:text-muted-foreground/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          placeholder=":itemId"
                          onblur={(ev) => {
                            if (ev.currentTarget.value.trim()) {
                              updateQuestItemId(questId, ev.currentTarget.value);
                            }
                          }}
                          onkeydown={(ev) => {
                            if (ev.key === "Enter") {
                              ev.currentTarget.blur();
                            }
                          }}
                          disabled={isSyncing}
                        />
                      {/if}
                      <button
                        type="button"
                        class="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                        onclick={() => removeQuest(questId)}
                        disabled={isSyncing}
                      >
                        <X class="h-3 w-3" />
                      </button>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>

            <div class="flex flex-col gap-2.5 border-t border-border/50 pt-3">
              <div class="flex items-center gap-2">
                <Checkbox
                  id="auto-requirements"
                  checked={autoRegisterRequirements}
                  disabled={isSyncing}
                  onCheckedChange={(checked) => updateAutoRegisterRequirements(Boolean(checked))}
                />
                <Label for="auto-requirements" class="text-xs text-muted-foreground cursor-pointer">
                  Auto register requirements
                </Label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox
                  id="auto-rewards"
                  checked={autoRegisterRewards}
                  disabled={isSyncing}
                  onCheckedChange={(checked) => updateAutoRegisterRewards(Boolean(checked))}
                />
                <Label for="auto-rewards" class="text-xs text-muted-foreground cursor-pointer">
                  Auto register rewards
                </Label>
              </div>
            </div>
          </div>
        </section>

        <section class="flex flex-col rounded-xl border border-border/50 bg-card">
          <div class="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div class="flex items-center gap-2">
              <Package class="h-4 w-4 text-muted-foreground" />
              <h2 class="text-sm font-semibold text-foreground">Drops</h2>
              {#if dropItems.length > 0}
                <span class="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {dropItems.length}
                </span>
              {/if}
            </div>
            {#if dropItems.length > 0}
              <Button
                variant="ghost"
                size="sm"
                class="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                onclick={clearDrops}
                disabled={isSyncing}
              >
                <Trash2 class="h-3.5 w-3.5" />
                Clear
              </Button>
            {/if}
          </div>

          <div class="flex flex-col gap-3 p-4">
            <form class="flex items-center gap-2" onsubmit={handleDropSubmit}>
              <Input
                type="text"
                placeholder="Enter item name..."
                bind:value={dropInput}
                class="flex-1 bg-secondary/50 border-border/50"
                autocomplete="off"
                spellcheck="false"
              />
              <Button
                type="submit"
                size="sm"
                class="gap-1.5"
                disabled={isSyncing || !dropInput.trim()}
              >
                <Plus class="h-4 w-4" />
                Add
              </Button>
            </form>

            <div class="min-h-[80px] max-h-32 overflow-y-auto">
              {#if dropItems.length === 0}
                <div class="flex h-20 items-center justify-center">
                  <span class="text-xs text-muted-foreground/70">No drops registered</span>
                </div>
              {:else}
                <div class="flex flex-wrap gap-1.5">
                  {#each dropItems as drop (drop)}
                    <span
                      class="group inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      {drop}
                      <button
                        type="button"
                        class="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                        onclick={() => removeDrop(drop)}
                        disabled={isSyncing}
                      >
                        <X class="h-3 w-3" />
                      </button>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>

            <div class="flex items-center gap-2 border-t border-border/50 pt-3">
              <Checkbox
                id="reject-else"
                checked={rejectElse}
                disabled={isSyncing}
                onCheckedChange={(checked) => updateRejectElse(Boolean(checked))}
              />
              <Label for="reject-else" class="text-xs text-muted-foreground cursor-pointer">
                Reject else
              </Label>
            </div>
          </div>
        </section>

        <section class="flex flex-col rounded-xl border border-border/50 bg-card">
          <div class="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div class="flex items-center gap-2">
              <Zap class="h-4 w-4 text-muted-foreground" />
              <h2 class="text-sm font-semibold text-foreground">Boosts</h2>
              {#if boostItems.length > 0}
                <span class="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {boostItems.length}
                </span>
              {/if}
            </div>
            <div class="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                class="h-7 gap-1.5 text-xs border-border/50"
                onclick={grabBoosts}
                disabled={isSyncing}
              >
                <Download class="h-3.5 w-3.5" />
                Grab
              </Button>
              {#if boostItems.length > 0}
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onclick={clearBoosts}
                  disabled={isSyncing}
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  Clear
                </Button>
              {/if}
            </div>
          </div>

          <div class="flex flex-col gap-3 p-4">
            <form class="flex items-center gap-2" onsubmit={handleBoostSubmit}>
              <Input
                type="text"
                placeholder="Enter boost name..."
                bind:value={boostInput}
                class="flex-1 bg-secondary/50 border-border/50"
                autocomplete="off"
                spellcheck="false"
              />
              <Button
                type="submit"
                size="sm"
                class="gap-1.5"
                disabled={isSyncing || !boostInput.trim()}
              >
                <Plus class="h-4 w-4" />
                Add
              </Button>
            </form>

            <div class="min-h-[80px] max-h-32 overflow-y-auto">
              {#if boostItems.length === 0}
                <div class="flex h-20 items-center justify-center">
                  <span class="text-xs text-muted-foreground/70">No boosts registered</span>
                </div>
              {:else}
                <div class="flex flex-wrap gap-1.5">
                  {#each boostItems as boost (boost)}
                    <span
                      class="group inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      {boost}
                      <button
                        type="button"
                        class="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                        onclick={() => removeBoost(boost)}
                        disabled={isSyncing}
                      >
                        <X class="h-3 w-3" />
                      </button>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</div>
