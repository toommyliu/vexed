<script lang="ts">
  import { Button, Icon, AppFrame } from "@vexed/ui";
  import { onMount } from "svelte";
  import { normalizeId } from "@vexed/utils/id";

  import {
    areEnvironmentStatesEqual,
    normalizeEnvironmentState,
  } from "~/shared/environment/helpers";
  import type { EnvironmentState } from "~/shared/environment/types";
  import { client, handlers } from "~/shared/tipc";

  import QuestsSection from "./components/QuestsSection.svelte";
  import DropsSection from "./components/DropsSection.svelte";
  import BoostsSection from "./components/BoostsSection.svelte";

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

  function getLocalState(): EnvironmentState {
    return {
      questIds,
      questItemIds,
      itemNames: dropItems,
      boosts: boostItems,
      rejectElse,
      autoRegisterRequirements,
      autoRegisterRewards,
    };
  }

  function applyState(state: EnvironmentState): void {
    questIds = state.questIds;
    questItemIds = state.questItemIds;
    dropItems = state.itemNames;
    boostItems = state.boosts;
    rejectElse = state.rejectElse;
    autoRegisterRequirements = state.autoRegisterRequirements;
    autoRegisterRewards = state.autoRegisterRewards;
  }

  function shouldUpdateState(state: EnvironmentState): boolean {
    const normalizedIncoming = normalizeEnvironmentState(state);
    const normalizedLocal = normalizeEnvironmentState(getLocalState());
    if (areEnvironmentStatesEqual(normalizedIncoming, normalizedLocal))
      return false;
    applyState(normalizedIncoming);
    return true;
  }

  async function initializeState() {
    try {
      const state = await client.environment.getState();
      void shouldUpdateState(state);
    } catch (error) {
      console.error("Failed to load environment state", error);
    }
  }

  async function syncEnvironment() {
    if (isSyncing) {
      pendingSync = true;
      return;
    }

    const payload = normalizeEnvironmentState(getLocalState());
    isSyncing = true;
    try {
      await client.environment.updateState(payload);
    } catch (error) {
      console.error("Failed to sync environment state", error);
    } finally {
      // eslint-disable-next-line require-atomic-updates
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

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const current = new Set(questIds);
    const newItemIds = { ...questItemIds };
    let added = false;
    for (const token of tokens) {
      const colonIdx = token.indexOf(":");
      let questIdPart: string;
      let itemIdPart: string | undefined;
      if (colonIdx === -1) {
        questIdPart = token;
      } else {
        questIdPart = token.slice(0, colonIdx);
        itemIdPart = token.slice(colonIdx + 1);
      }

      const parsed = normalizeId(questIdPart);
      if (parsed === null || parsed === -1) continue;
      if (!current.has(parsed)) {
        current.add(parsed);
        added = true;
      }

      if (itemIdPart) {
        const itemId = normalizeId(itemIdPart);
        if (itemId !== null && itemId > 0) {
          newItemIds[parsed] = itemId;
          added = true;
        }
      }
    }

    if (!added) return;

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
    const itemId = normalizeId(itemIdStr);
    if (itemId === null || itemId <= 0) {
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
    if (!tokens.length) return;

    dropInput = "";
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
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

    if (!added) return;
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
    if (!tokens.length) return;

    boostInput = "";
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
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

    if (!added) return;
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
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
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
      console.error("Failed to grab boosts.", error);
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

  function clearAll() {
    questIds = [];
    questItemIds = {};
    dropItems = [];
    boostItems = [];
    void syncEnvironment();
  }

  async function broadcastToAll() {
    if (isBroadcasting) return;
    const payload = normalizeEnvironmentState(getLocalState());
    isBroadcasting = true;
    try {
      await client.environment.broadcastState(payload);
    } catch (error) {
      console.error("Failed to broadcast environment state.", error);
    } finally {
      // eslint-disable-next-line require-atomic-updates
      isBroadcasting = false;
    }
  }
</script>

<AppFrame.Root>
  <AppFrame.Header title="Environment">
    {#snippet right()}
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-7 gap-1.5 border-border/40 text-xs text-destructive hover:bg-destructive/5"
          onclick={clearAll}
        >
          <Icon icon="trash" size="sm" />
          <span>Clear all</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-7 gap-1.5 border-border/40 text-xs"
          onclick={broadcastToAll}
          disabled={isBroadcasting}
        >
          <Icon icon="share" size="sm" />
          <span>Sync to all</span>
        </Button>
      </div>
    {/snippet}
  </AppFrame.Header>

  <AppFrame.Body maxWidth="max-w-7xl">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <QuestsSection
        {questInput}
        {questIds}
        {questItemIds}
        {autoRegisterRequirements}
        {autoRegisterRewards}
        onQuestInputInput={(value) => (questInput = value)}
        onQuestSubmit={handleQuestSubmit}
        onClearQuests={clearQuests}
        onRemoveQuest={removeQuest}
        onUpdateQuestItemId={updateQuestItemId}
        onAutoRegisterRequirementsChange={updateAutoRegisterRequirements}
        onAutoRegisterRewardsChange={updateAutoRegisterRewards}
      />

      <DropsSection
        {dropInput}
        {dropItems}
        {rejectElse}
        onDropInputInput={(value) => (dropInput = value)}
        onDropSubmit={handleDropSubmit}
        onClearDrops={clearDrops}
        onRemoveDrop={removeDrop}
        onRejectElseChange={updateRejectElse}
      />

      <BoostsSection
        {boostInput}
        {boostItems}
        onBoostInputInput={(value) => (boostInput = value)}
        onBoostSubmit={handleBoostSubmit}
        onClearBoosts={clearBoosts}
        onGrabBoosts={grabBoosts}
        onRemoveBoost={removeBoost}
      />
    </div>
  </AppFrame.Body>
</AppFrame.Root>
