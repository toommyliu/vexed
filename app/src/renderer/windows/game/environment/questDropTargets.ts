import type { Quest } from "@vexed/game";
import type { EnvironmentQuestAutoRegisterOptions } from "../../../../shared/environment";

type QuestDropTargetItem = {
  readonly ItemID?: unknown;
  readonly bTemp?: unknown;
  readonly sName?: unknown;
};

type QuestDropTargetData = {
  readonly RequiredItems?: unknown;
  readonly Rewards?: unknown;
  readonly oRewards?: unknown;
  readonly oItems?: unknown;
  readonly reward?: unknown;
  readonly turnin?: unknown;
};

type QuestDropTargetRequirement = {
  readonly ItemID?: unknown;
  readonly bTemp?: unknown;
  readonly sName?: unknown;
};

type QuestDropTargetReward = {
  readonly ItemID?: unknown;
  readonly sName?: unknown;
};

const normalizeName = (name: unknown): string | undefined => {
  if (typeof name !== "string") {
    return undefined;
  }

  const trimmed = name.trim();
  return trimmed === "" ? undefined : trimmed;
};

const addName = (names: Map<string, string>, name: unknown): void => {
  const normalized = normalizeName(name);
  if (normalized === undefined) {
    return;
  }

  const key = normalized.toLowerCase();
  if (!names.has(key)) {
    names.set(key, normalized);
  }
};

const isTempItem = (value: unknown): boolean =>
  value === true || value === 1 || value === "1";

const toItemIdKey = (value: unknown): string | undefined => {
  if (typeof value !== "number" && typeof value !== "string") {
    return undefined;
  }

  const parsed =
    typeof value === "number" ? value : Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const itemId = Math.trunc(parsed);
  return itemId > 0 ? String(itemId) : undefined;
};

const asArray = <A>(value: unknown): A[] =>
  Array.isArray(value) ? (value as A[]) : [];

const getQuestData = (quest: Quest): QuestDropTargetData => {
  const data = quest.data;
  const value = Array.isArray(data) ? data[0] : data;
  return typeof value === "object" && value !== null
    ? (value as QuestDropTargetData)
    : {};
};

const collectItemDataById = (
  value: unknown,
  items: Map<string, QuestDropTargetItem>,
): void => {
  if (typeof value !== "object" || value === null) {
    return;
  }

  const record = value as Record<string, unknown>;
  const itemId = toItemIdKey((record as QuestDropTargetItem).ItemID);
  if (itemId !== undefined) {
    items.set(itemId, record as QuestDropTargetItem);
    return;
  }

  for (const child of Object.values(record)) {
    collectItemDataById(child, items);
  }
};

const asItemDataById = (...values: readonly unknown[]) => {
  const items = new Map<string, QuestDropTargetItem>();
  for (const value of values) {
    collectItemDataById(value, items);
  }

  return items;
};

export const getQuestDropTargetNames = (
  quest: Quest,
  options: EnvironmentQuestAutoRegisterOptions,
): readonly string[] => {
  const names = new Map<string, string>();
  const data = getQuestData(quest);
  const rewardItemDataById = asItemDataById(data.oRewards);
  const itemDataById = asItemDataById(data.oRewards, data.oItems);

  if (options.rewards) {
    for (const reward of asArray<QuestDropTargetReward>(data.Rewards)) {
      const itemId = toItemIdKey(reward.ItemID);
      addName(
        names,
        reward.sName ??
          (itemId === undefined ? undefined : itemDataById.get(itemId)?.sName),
      );
    }

    for (const reward of asArray<QuestDropTargetReward>(data.reward)) {
      const itemId = toItemIdKey(reward.ItemID);
      if (itemId === undefined) {
        continue;
      }

      addName(names, reward.sName ?? itemDataById.get(itemId)?.sName);
    }

    for (const reward of rewardItemDataById.values()) {
      addName(names, reward.sName);
    }
  }

  if (options.requirements) {
    for (const requirement of [
      ...asArray<QuestDropTargetRequirement>(data.RequiredItems),
      ...asArray<QuestDropTargetRequirement>(data.turnin),
    ]) {
      const itemId = toItemIdKey(requirement.ItemID);
      if (itemId === undefined) {
        continue;
      }

      const itemData = itemDataById.get(itemId);
      const tempFlag = itemData?.bTemp ?? requirement.bTemp;
      if (tempFlag === undefined || isTempItem(tempFlag)) {
        continue;
      }

      addName(names, requirement.sName ?? itemData?.sName);
    }
  }

  return Array.from(names.values());
};
