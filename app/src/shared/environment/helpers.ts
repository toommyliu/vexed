import { normalizeId } from "@vexed/utils/id";
import type { EnvironmentState, EnvironmentUpdatePayload } from "./types";

export type NormalizeEnvironmentOptions = {
  caseInsensitive?: boolean;
};

// TODO: we may just force this to be case insensitive and remove the option
const DEFAULT_OPTIONS: Required<NormalizeEnvironmentOptions> = {
  caseInsensitive: true,
};

export function createEmptyEnvironmentState(): EnvironmentState {
  return {
    autoRegisterRequirements: false,
    autoRegisterRewards: false,
    boosts: [],
    itemNames: [],
    questIds: [],
    questItemIds: {},
    rejectElse: false,
  };
}

export function normalizeStringList(
  items: Iterable<string>,
  options: NormalizeEnvironmentOptions = {},
): string[] {
  const { caseInsensitive } = { ...DEFAULT_OPTIONS, ...options };
  const deduped = new Map<string, string>();
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = caseInsensitive ? trimmed.toLowerCase() : trimmed;
    if (!deduped.has(key)) deduped.set(key, trimmed);
  }

  return Array.from(deduped.values()).sort((a, b) => a.localeCompare(b));
}

export function normalizeQuestItemIds(
  questIds: Iterable<number>,
  questItemIds: Record<number, number> | undefined,
): Record<number, number> {
  const questIdSet = new Set<number>(questIds);
  const normalized: Record<number, number> = {};
  if (!questItemIds) return normalized;
  for (const [questIdStr, itemId] of Object.entries(questItemIds)) {
    const questId = Number(questIdStr);
    if (questIdSet.has(questId)) normalized[questId] = itemId;
  }

  return normalized;
}

function normalizeQuestIds(questIds: (number | string)[]): number[] {
  const normalized = new Set<number>();
  for (const questId of questIds) {
    const parsed = normalizeId(questId);
    if (parsed === null || parsed === -1) continue;
    normalized.add(parsed);
  }

  return Array.from(normalized).sort((a, b) => a - b);
}

export function normalizeEnvironmentState(
  state: EnvironmentState,
  options: NormalizeEnvironmentOptions = {},
): EnvironmentState {
  const normalizedQuestIds = normalizeQuestIds(state.questIds);
  return {
    autoRegisterRequirements: Boolean(state.autoRegisterRequirements),
    autoRegisterRewards: Boolean(state.autoRegisterRewards),
    boosts: normalizeStringList(state.boosts ?? [], options),
    itemNames: normalizeStringList(state.itemNames ?? [], options),
    questIds: normalizedQuestIds,
    questItemIds: normalizeQuestItemIds(normalizedQuestIds, state.questItemIds),
    rejectElse: Boolean(state.rejectElse),
  };
}

export function normalizeEnvironmentUpdate(
  update: EnvironmentUpdatePayload,
  _currentState: EnvironmentState,
  options: NormalizeEnvironmentOptions = {},
): EnvironmentState {
  const normalizedQuestIds = normalizeQuestIds(update.questIds);
  return {
    autoRegisterRequirements: update.autoRegisterRequirements,
    autoRegisterRewards: update.autoRegisterRewards,
    boosts: normalizeStringList(update.boosts, options),
    itemNames: normalizeStringList(update.itemNames, options),
    questIds: normalizedQuestIds,
    questItemIds: normalizeQuestItemIds(
      normalizedQuestIds,
      update.questItemIds,
    ),
    rejectElse: update.rejectElse,
  };
}

export function areEnvironmentStatesEqual(
  left: EnvironmentState,
  right: EnvironmentState,
  options: NormalizeEnvironmentOptions = {},
): boolean {
  const a = normalizeEnvironmentState(left, options);
  const b = normalizeEnvironmentState(right, options);

  if (a.autoRegisterRequirements !== b.autoRegisterRequirements) return false;
  if (a.autoRegisterRewards !== b.autoRegisterRewards) return false;
  if (a.rejectElse !== b.rejectElse) return false;
  if (!areArraysEqual(a.questIds, b.questIds)) return false;
  if (!areArraysEqual(a.itemNames, b.itemNames)) return false;
  if (!areArraysEqual(a.boosts, b.boosts)) return false;
  if (!areQuestItemIdsEqual(a.questItemIds, b.questItemIds)) return false;

  return true;
}

export type EnvironmentStateDiff = {
  field: keyof EnvironmentState;
  before: unknown;
  after: unknown;
};

export function diffEnvironmentState(
  before: EnvironmentState,
  after: EnvironmentState,
  options: NormalizeEnvironmentOptions = {},
): EnvironmentStateDiff[] {
  const a = normalizeEnvironmentState(before, options);
  const b = normalizeEnvironmentState(after, options);
  const diffs: EnvironmentStateDiff[] = [];

  if (a.autoRegisterRequirements !== b.autoRegisterRequirements) {
    diffs.push({
      field: "autoRegisterRequirements",
      before: a.autoRegisterRequirements,
      after: b.autoRegisterRequirements,
    });
  }

  if (a.autoRegisterRewards !== b.autoRegisterRewards) {
    diffs.push({
      field: "autoRegisterRewards",
      before: a.autoRegisterRewards,
      after: b.autoRegisterRewards,
    });
  }

  if (a.rejectElse !== b.rejectElse) {
    diffs.push({
      field: "rejectElse",
      before: a.rejectElse,
      after: b.rejectElse,
    });
  }

  if (!areArraysEqual(a.questIds, b.questIds)) {
    diffs.push({ field: "questIds", before: a.questIds, after: b.questIds });
  }

  if (!areQuestItemIdsEqual(a.questItemIds, b.questItemIds)) {
    diffs.push({
      field: "questItemIds",
      before: a.questItemIds,
      after: b.questItemIds,
    });
  }

  if (!areArraysEqual(a.itemNames, b.itemNames)) {
    diffs.push({
      field: "itemNames",
      before: a.itemNames,
      after: b.itemNames,
    });
  }

  if (!areArraysEqual(a.boosts, b.boosts)) {
    diffs.push({ field: "boosts", before: a.boosts, after: b.boosts });
  }

  return diffs;
}

function areArraysEqual<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false;
  for (let idx = 0; idx < left.length; idx += 1) {
    if (left[idx] !== right[idx]) return false;
  }
  return true;
}

function areQuestItemIdsEqual(
  left: Record<number, number>,
  right: Record<number, number>,
): boolean {
  const leftKeys = Object.keys(left).sort((a, b) => a.localeCompare(b));
  const rightKeys = Object.keys(right).sort((a, b) => a.localeCompare(b));
  if (leftKeys.length !== rightKeys.length) return false;
  for (const [idx, leftKey] of leftKeys.entries()) {
    if (leftKey !== rightKeys[idx]) return false;
    const key = Number(leftKey);
    if (left[key] !== right[key]) return false;
  }
  return true;
}
