export const QUEST_RECONCILE_CONCURRENCY = 4;
export const QUEST_MUTATION_DELAY_MS = 750;
export const QUEST_ACTION_TIMEOUT = "5 seconds";

export const QUEST_ACTION_RETRY_DELAYS_MS = [2_000, 5_000, 15_000] as const;

export type QuestAutomationAction = "accept" | "complete";

export type QuestAutomationIntent =
  | {
      readonly action: "accept";
      readonly questId: number;
    }
  | {
      readonly action: "complete";
      readonly questId: number;
      readonly rewardItemId?: number | undefined;
    }
  | {
      readonly action: "none";
      readonly questId: number;
    };

export interface QuestActionFailure {
  readonly attempts: number;
  readonly retryAfter: number;
}

export interface QuestIntentInput {
  readonly questId: number;
  readonly rewardItemId?: number | undefined;
  readonly inProgress: boolean;
  readonly canComplete: boolean;
  readonly available: boolean;
}

export const createQuestAutomationIntent = (
  input: QuestIntentInput,
): QuestAutomationIntent => {
  if (input.inProgress) {
    if (!input.canComplete) {
      return { action: "none", questId: input.questId };
    }

    return input.rewardItemId === undefined
      ? { action: "complete", questId: input.questId }
      : {
          action: "complete",
          questId: input.questId,
          rewardItemId: input.rewardItemId,
        };
  }

  return input.available
    ? { action: "accept", questId: input.questId }
    : { action: "none", questId: input.questId };
};

export const getQuestActionKey = (
  intent: QuestAutomationIntent,
): string | undefined =>
  intent.action === "none"
    ? undefined
    : `quest:${intent.action}:${intent.questId}`;

export const getQuestActionRetryDelayMs = (attempts: number): number => {
  const index = Math.min(
    Math.max(0, attempts - 1),
    QUEST_ACTION_RETRY_DELAYS_MS.length - 1,
  );
  const delayMs = QUEST_ACTION_RETRY_DELAYS_MS[index];

  return delayMs === undefined ? 15_000 : delayMs;
};

export const canRunQuestAction = (
  failures: ReadonlyMap<string, QuestActionFailure>,
  key: string,
  now: number,
): boolean => {
  const failure = failures.get(key);
  return failure === undefined || now >= failure.retryAfter;
};

export const recordQuestActionFailure = (
  failures: ReadonlyMap<string, QuestActionFailure>,
  key: string,
  failedAt: number,
): ReadonlyMap<string, QuestActionFailure> => {
  const attempts = (failures.get(key)?.attempts ?? 0) + 1;
  const next = new Map(failures);
  next.set(key, {
    attempts,
    retryAfter: failedAt + getQuestActionRetryDelayMs(attempts),
  });
  return next;
};

export const clearQuestActionFailure = (
  failures: ReadonlyMap<string, QuestActionFailure>,
  key: string,
): ReadonlyMap<string, QuestActionFailure> => {
  if (!failures.has(key)) {
    return failures;
  }

  const next = new Map(failures);
  next.delete(key);
  return next;
};

export const getQuestMutationDelayMs = (
  lastMutationAt: number,
  now: number,
  delayMs = QUEST_MUTATION_DELAY_MS,
): number => Math.max(0, lastMutationAt + delayMs - now);
