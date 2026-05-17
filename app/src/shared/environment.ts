export const EnvironmentItemBuckets = [
  "ac-member",
  "ac-non-member",
  "non-ac-member",
  "non-ac-non-member",
] as const;

export type EnvironmentItemBucket = (typeof EnvironmentItemBuckets)[number];

export interface EnvironmentItemRules {
  readonly buckets: readonly EnvironmentItemBucket[];
  readonly rejectElse: boolean;
}

/** Handling options for drops that are not registered by name. */
export interface EnvironmentDropPolicy {
  /** Accept member-only AC-tagged items. */
  readonly acceptAcMemberOnlyDrops: boolean;
  /** Accept non-member AC-tagged items. */
  readonly acceptAcNonMemberDrops: boolean;
  /** Accept member-only non-AC items. */
  readonly acceptNonAcMemberOnlyDrops: boolean;
  /** Accept non-member non-AC items. */
  readonly acceptNonAcNonMemberDrops: boolean;
  /** Reject any unregistered drop that is not accepted by this policy. */
  readonly rejectUnregisteredDrops: boolean;
}

export interface EnvironmentQuestAutoRegisterOptions {
  readonly requirements: boolean;
  readonly rewards: boolean;
}

export type EnvironmentDropAction = "accept" | "reject" | "ignore";

export interface EnvironmentDropItemData {
  readonly bCoins: unknown;
  readonly bUpg: unknown;
  readonly sName: string;
}

export interface EnvironmentState {
  readonly questIds: readonly number[];
  readonly questAutoRegister: EnvironmentQuestAutoRegisterOptions;
  readonly questRewards: Readonly<Record<number, number>>;
  readonly itemNames: readonly string[];
  readonly itemRules: EnvironmentItemRules;
  readonly boosts: readonly string[];
}

export const DEFAULT_ENVIRONMENT_ITEM_RULES: EnvironmentItemRules = {
  buckets: [],
  rejectElse: false,
};

export const DEFAULT_ENVIRONMENT_DROP_POLICY: EnvironmentDropPolicy = {
  acceptAcMemberOnlyDrops: false,
  acceptAcNonMemberDrops: false,
  acceptNonAcMemberOnlyDrops: false,
  acceptNonAcNonMemberDrops: false,
  rejectUnregisteredDrops: false,
};

export const DEFAULT_ENVIRONMENT_QUEST_AUTO_REGISTER: EnvironmentQuestAutoRegisterOptions =
  {
    requirements: false,
    rewards: false,
  };

const environmentItemBucketSet = new Set<EnvironmentItemBucket>(
  EnvironmentItemBuckets,
);

const toPositiveInt = (value: number | string): number | undefined => {
  const parsed =
    typeof value === "number"
      ? value
      : /^\d+$/u.test(value.trim())
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : undefined;
};

const normalizeStringList = (values: readonly string[]): string[] => {
  const normalized = new Map<string, string>();

  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed === "") {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (!normalized.has(key)) {
      normalized.set(key, trimmed);
    }
  }

  return Array.from(normalized.values()).sort((left, right) =>
    left.localeCompare(right),
  );
};

const normalizeQuestIds = (
  questIds: readonly (number | string)[],
): number[] => {
  const normalized: number[] = [];
  const seen = new Set<number>();

  for (const rawQuestId of questIds) {
    const questId = toPositiveInt(rawQuestId);
    if (questId === undefined || seen.has(questId)) {
      continue;
    }

    seen.add(questId);
    normalized.push(questId);
  }

  return normalized.sort((left, right) => left - right);
};

const normalizeQuestRewards = (
  questIds: readonly number[],
  questRewards: Readonly<Record<number, number>>,
): Record<number, number> => {
  const normalized: Record<number, number> = {};
  const questIdSet = new Set(questIds);

  for (const [rawQuestId, rawRewardItemId] of Object.entries(questRewards)) {
    const questId = toPositiveInt(rawQuestId);
    const rewardItemId = toPositiveInt(rawRewardItemId);
    if (
      questId === undefined ||
      rewardItemId === undefined ||
      !questIdSet.has(questId)
    ) {
      continue;
    }

    normalized[questId] = rewardItemId;
  }

  return normalized;
};

const normalizeBoolean = (value: unknown): boolean =>
  value === true || value === 1 || value === "1";

export const isEnvironmentItemBucket = (
  value: unknown,
): value is EnvironmentItemBucket =>
  typeof value === "string" &&
  environmentItemBucketSet.has(value as EnvironmentItemBucket);

export const normalizeEnvironmentItemRules = (
  rules: unknown,
): EnvironmentItemRules => {
  if (typeof rules !== "object" || rules === null) {
    return DEFAULT_ENVIRONMENT_ITEM_RULES;
  }

  const record = rules as Partial<EnvironmentItemRules>;
  const buckets = new Set<EnvironmentItemBucket>();

  if (Array.isArray(record.buckets)) {
    for (const bucket of record.buckets) {
      if (isEnvironmentItemBucket(bucket)) {
        buckets.add(bucket);
      }
    }
  }

  return {
    buckets: EnvironmentItemBuckets.filter((bucket) => buckets.has(bucket)),
    rejectElse: record.rejectElse === true,
  };
};

export const environmentItemRulesToDropPolicy = (
  rules: EnvironmentItemRules,
): EnvironmentDropPolicy => {
  const normalized = normalizeEnvironmentItemRules(rules);
  const buckets = new Set(normalized.buckets);

  return {
    acceptAcMemberOnlyDrops: buckets.has("ac-member"),
    acceptAcNonMemberDrops: buckets.has("ac-non-member"),
    acceptNonAcMemberOnlyDrops: buckets.has("non-ac-member"),
    acceptNonAcNonMemberDrops: buckets.has("non-ac-non-member"),
    rejectUnregisteredDrops: normalized.rejectElse,
  };
};

export const environmentDropPolicyToItemRules = (
  policy: EnvironmentDropPolicy,
): EnvironmentItemRules => {
  const buckets = new Set<EnvironmentItemBucket>();

  if (policy.acceptAcMemberOnlyDrops) {
    buckets.add("ac-member");
  }
  if (policy.acceptAcNonMemberDrops) {
    buckets.add("ac-non-member");
  }
  if (policy.acceptNonAcMemberOnlyDrops) {
    buckets.add("non-ac-member");
  }
  if (policy.acceptNonAcNonMemberDrops) {
    buckets.add("non-ac-non-member");
  }

  return normalizeEnvironmentItemRules({
    buckets: EnvironmentItemBuckets.filter((bucket) => buckets.has(bucket)),
    rejectElse: policy.rejectUnregisteredDrops,
  });
};

export const patchEnvironmentDropPolicy = (
  rules: EnvironmentItemRules,
  patch: Partial<EnvironmentDropPolicy>,
): EnvironmentItemRules => {
  const current = environmentItemRulesToDropPolicy(rules);

  return environmentDropPolicyToItemRules({
    acceptAcMemberOnlyDrops:
      typeof patch.acceptAcMemberOnlyDrops === "boolean"
        ? patch.acceptAcMemberOnlyDrops
        : current.acceptAcMemberOnlyDrops,
    acceptAcNonMemberDrops:
      typeof patch.acceptAcNonMemberDrops === "boolean"
        ? patch.acceptAcNonMemberDrops
        : current.acceptAcNonMemberDrops,
    acceptNonAcMemberOnlyDrops:
      typeof patch.acceptNonAcMemberOnlyDrops === "boolean"
        ? patch.acceptNonAcMemberOnlyDrops
        : current.acceptNonAcMemberOnlyDrops,
    acceptNonAcNonMemberDrops:
      typeof patch.acceptNonAcNonMemberDrops === "boolean"
        ? patch.acceptNonAcNonMemberDrops
        : current.acceptNonAcNonMemberDrops,
    rejectUnregisteredDrops:
      typeof patch.rejectUnregisteredDrops === "boolean"
        ? patch.rejectUnregisteredDrops
        : current.rejectUnregisteredDrops,
  });
};

export const normalizeEnvironmentQuestAutoRegisterOptions = (
  options: unknown,
): EnvironmentQuestAutoRegisterOptions => {
  if (typeof options !== "object" || options === null) {
    return DEFAULT_ENVIRONMENT_QUEST_AUTO_REGISTER;
  }

  const record = options as Partial<EnvironmentQuestAutoRegisterOptions>;
  return {
    requirements: record.requirements === true,
    rewards: record.rewards === true,
  };
};

export const isEnvironmentItemRules = (
  value: unknown,
): value is EnvironmentItemRules =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as Partial<EnvironmentItemRules>).buckets);

export const isEnvironmentQuestAutoRegisterOptions = (
  value: unknown,
): value is EnvironmentQuestAutoRegisterOptions =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Partial<EnvironmentQuestAutoRegisterOptions>)
    .requirements === "boolean" &&
  typeof (value as Partial<EnvironmentQuestAutoRegisterOptions>).rewards ===
    "boolean";

export const classifyEnvironmentDropItem = (
  item: EnvironmentDropItemData,
): EnvironmentItemBucket => {
  const ac = normalizeBoolean(item.bCoins);
  const member = normalizeBoolean(item.bUpg);

  if (ac && member) {
    return "ac-member";
  }

  if (ac) {
    return "ac-non-member";
  }

  if (member) {
    return "non-ac-member";
  }

  return "non-ac-non-member";
};

export const hasEnvironmentItemName = (
  state: Pick<EnvironmentState, "itemNames">,
  itemName: string,
): boolean => {
  const key = itemName.trim().toLowerCase();

  return state.itemNames.some(
    (watchedName) => watchedName.trim().toLowerCase() === key,
  );
};

export const resolveEnvironmentDropAction = (
  state: Pick<EnvironmentState, "itemNames" | "itemRules">,
  item: EnvironmentDropItemData,
): EnvironmentDropAction => {
  if (hasEnvironmentItemName(state, item.sName)) {
    return "accept";
  }

  const bucket = classifyEnvironmentDropItem(item);
  if (state.itemRules.buckets.includes(bucket)) {
    return "accept";
  }

  return state.itemRules.rejectElse ? "reject" : "ignore";
};

export const createEmptyEnvironmentState = (): EnvironmentState => ({
  questIds: [],
  questAutoRegister: DEFAULT_ENVIRONMENT_QUEST_AUTO_REGISTER,
  questRewards: {},
  itemNames: [],
  itemRules: DEFAULT_ENVIRONMENT_ITEM_RULES,
  boosts: [],
});

export const normalizeEnvironmentState = (
  state: EnvironmentState,
): EnvironmentState => {
  const questIds = normalizeQuestIds(state.questIds);

  return {
    questIds,
    questAutoRegister: normalizeEnvironmentQuestAutoRegisterOptions(
      state.questAutoRegister,
    ),
    questRewards: normalizeQuestRewards(questIds, state.questRewards),
    itemNames: normalizeStringList(state.itemNames),
    itemRules: normalizeEnvironmentItemRules(state.itemRules),
    boosts: normalizeStringList(state.boosts),
  };
};

export const addEnvironmentQuest = (
  state: EnvironmentState,
  questId: number | string,
  rewardItemId?: number | string,
): EnvironmentState => {
  const normalizedQuestId = toPositiveInt(questId);
  if (normalizedQuestId === undefined) {
    return normalizeEnvironmentState(state);
  }

  const questIds = [...state.questIds, normalizedQuestId];
  const questRewards = { ...state.questRewards };
  const normalizedRewardItemId =
    rewardItemId === undefined ? undefined : toPositiveInt(rewardItemId);
  if (normalizedRewardItemId !== undefined) {
    questRewards[normalizedQuestId] = normalizedRewardItemId;
  }

  return normalizeEnvironmentState({
    ...state,
    questIds,
    questRewards,
  });
};

export const removeEnvironmentQuest = (
  state: EnvironmentState,
  questId: number | string,
): EnvironmentState => {
  const normalizedQuestId = toPositiveInt(questId);
  if (normalizedQuestId === undefined) {
    return normalizeEnvironmentState(state);
  }

  const { [normalizedQuestId]: _removed, ...questRewards } = state.questRewards;

  return normalizeEnvironmentState({
    ...state,
    questIds: state.questIds.filter((value) => value !== normalizedQuestId),
    questRewards,
  });
};

export const setEnvironmentQuestReward = (
  state: EnvironmentState,
  questId: number | string,
  rewardItemId: number | string,
): EnvironmentState => {
  const normalizedQuestId = toPositiveInt(questId);
  const normalizedRewardItemId = toPositiveInt(rewardItemId);
  if (normalizedQuestId === undefined || normalizedRewardItemId === undefined) {
    return normalizeEnvironmentState(state);
  }

  return addEnvironmentQuest(
    {
      ...state,
      questRewards: {
        ...state.questRewards,
        [normalizedQuestId]: normalizedRewardItemId,
      },
    },
    normalizedQuestId,
  );
};

export const clearEnvironmentQuestReward = (
  state: EnvironmentState,
  questId: number | string,
): EnvironmentState => {
  const normalizedQuestId = toPositiveInt(questId);
  if (normalizedQuestId === undefined) {
    return normalizeEnvironmentState(state);
  }

  const { [normalizedQuestId]: _removed, ...questRewards } = state.questRewards;

  return normalizeEnvironmentState({
    ...state,
    questRewards,
  });
};

export const clearEnvironmentQuests = (
  state: EnvironmentState,
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    questIds: [],
    questRewards: {},
  });

export const setEnvironmentQuestAutoRegisterOptions = (
  state: EnvironmentState,
  options: EnvironmentQuestAutoRegisterOptions,
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    questAutoRegister: options,
  });

export const addEnvironmentItem = (
  state: EnvironmentState,
  name: string,
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    itemNames: [...state.itemNames, name],
  });

export const removeEnvironmentItem = (
  state: EnvironmentState,
  name: string,
): EnvironmentState => {
  const key = name.trim().toLowerCase();
  return normalizeEnvironmentState({
    ...state,
    itemNames: state.itemNames.filter((itemName) => {
      return itemName.trim().toLowerCase() !== key;
    }),
  });
};

export const setEnvironmentItemRules = (
  state: EnvironmentState,
  itemRules: EnvironmentItemRules,
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    itemRules,
  });

export const setEnvironmentDropPolicy = (
  state: EnvironmentState,
  policy: Partial<EnvironmentDropPolicy>,
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    itemRules: patchEnvironmentDropPolicy(state.itemRules, policy),
  });

export const clearEnvironmentItems = (
  state: EnvironmentState,
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    itemNames: [],
    itemRules: DEFAULT_ENVIRONMENT_ITEM_RULES,
  });

export const addEnvironmentBoost = (
  state: EnvironmentState,
  name: string,
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    boosts: [...state.boosts, name],
  });

export const addEnvironmentBoosts = (
  state: EnvironmentState,
  boosts: readonly string[],
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    boosts: [...state.boosts, ...boosts],
  });

export const removeEnvironmentBoost = (
  state: EnvironmentState,
  name: string,
): EnvironmentState => {
  const key = name.trim().toLowerCase();
  return normalizeEnvironmentState({
    ...state,
    boosts: state.boosts.filter((boostName) => {
      return boostName.trim().toLowerCase() !== key;
    }),
  });
};

export const clearEnvironmentBoosts = (
  state: EnvironmentState,
): EnvironmentState =>
  normalizeEnvironmentState({
    ...state,
    boosts: [],
  });

export const clearEnvironmentState = (): EnvironmentState =>
  createEmptyEnvironmentState();

export const areEnvironmentStatesEqual = (
  left: EnvironmentState,
  right: EnvironmentState,
): boolean => {
  const normalizedLeft = normalizeEnvironmentState(left);
  const normalizedRight = normalizeEnvironmentState(right);

  return (
    areEnvironmentItemRulesEqual(
      normalizedLeft.itemRules,
      normalizedRight.itemRules,
    ) &&
    areArraysEqual(normalizedLeft.questIds, normalizedRight.questIds) &&
    areEnvironmentQuestAutoRegisterOptionsEqual(
      normalizedLeft.questAutoRegister,
      normalizedRight.questAutoRegister,
    ) &&
    areArraysEqual(normalizedLeft.itemNames, normalizedRight.itemNames) &&
    areArraysEqual(normalizedLeft.boosts, normalizedRight.boosts) &&
    areRecordsEqual(normalizedLeft.questRewards, normalizedRight.questRewards)
  );
};

const areArraysEqual = <T>(left: readonly T[], right: readonly T[]): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const areEnvironmentItemRulesEqual = (
  left: EnvironmentItemRules,
  right: EnvironmentItemRules,
): boolean =>
  left.rejectElse === right.rejectElse &&
  areArraysEqual(left.buckets, right.buckets);

const areEnvironmentQuestAutoRegisterOptionsEqual = (
  left: EnvironmentQuestAutoRegisterOptions,
  right: EnvironmentQuestAutoRegisterOptions,
): boolean =>
  left.requirements === right.requirements && left.rewards === right.rewards;

const areRecordsEqual = (
  left: Readonly<Record<number, number>>,
  right: Readonly<Record<number, number>>,
): boolean => {
  const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );
  const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every(([leftKey, leftValue], index) => {
    const rightEntry = rightEntries[index];
    return rightEntry?.[0] === leftKey && rightEntry[1] === leftValue;
  });
};
