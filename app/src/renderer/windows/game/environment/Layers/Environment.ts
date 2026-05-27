import type { BoostType } from "@vexed/game";
import {
  Cause,
  Effect,
  Layer,
  Option,
  Ref,
  Semaphore,
  SynchronizedRef,
} from "effect";
import {
  createEmptyEnvironmentState,
  hasEnvironmentItemName,
  normalizeEnvironmentState,
  patchEnvironmentDropPolicy,
  resolveEnvironmentDropAction,
  type EnvironmentState,
} from "../../../../../shared/environment";
import { Drops } from "../../flash/Services/Drops";
import { Inventory } from "../../flash/Services/Inventory";
import { Player } from "../../flash/Services/Player";
import { Quests } from "../../flash/Services/Quests";
import { Jobs } from "../../jobs/Services/Jobs";
import {
  canRunQuestAction,
  clearQuestActionFailure,
  createQuestAutomationIntent,
  getQuestActionKey,
  getQuestMutationDelayMs,
  QUEST_ACTION_TIMEOUT,
  QUEST_MUTATION_DELAY_MS,
  QUEST_RECONCILE_CONCURRENCY,
  recordQuestActionFailure,
  type QuestActionFailure,
  type QuestAutomationIntent,
} from "../questAutomation";
import { getQuestDropTargetNames } from "../questDropTargets";
import { Environment } from "../Services/Environment";
import type { EnvironmentShape } from "../Services/Environment";

const QUEST_JOB_KEY = "environment/quests";
const DROP_JOB_KEY = "environment/drops";
const BOOST_JOB_KEY = "environment/boosts";

const QUEST_JOB_INTERVAL = "1 second";
const DROP_JOB_INTERVAL = "500 millis";
const BOOST_JOB_INTERVAL = "5 seconds";

const boostTypeFromLink = (link: string): BoostType | undefined => {
  const [prefix] = link.toLowerCase().split("::");

  switch (prefix) {
    case "xpboost":
      return "exp";
    case "gboost":
      return "gold";
    case "repboost":
      return "rep";
    case "cpboost":
      return "classPoints";
    default:
      return undefined;
  }
};

const make = Effect.gen(function* () {
  const drops = yield* Drops;
  const inventory = yield* Inventory;
  const jobs = yield* Jobs;
  const player = yield* Player;
  const quests = yield* Quests;

  const services = yield* Effect.services();
  const runFork = Effect.runForkWith(services);
  const runPromise = Effect.runPromiseWith(services);
  const stateRef = yield* Ref.make<EnvironmentState>(
    createEmptyEnvironmentState(),
  );
  const questActionFailuresRef = yield* Ref.make<
    ReadonlyMap<string, QuestActionFailure>
  >(new Map());
  const inFlightQuestActionKeysRef = yield* SynchronizedRef.make<Set<string>>(
    new Set(),
  );
  const lastQuestMutationAtRef = yield* Ref.make(0);
  const unavailableQuestWarningsRef = yield* Ref.make<ReadonlySet<number>>(
    new Set(),
  );
  const questMutationSemaphore = yield* Semaphore.make(1);

  const setState = (state: EnvironmentState) =>
    Effect.gen(function* () {
      const normalizedState = normalizeEnvironmentState(state);
      yield* Ref.set(stateRef, normalizedState);
      yield* Ref.update(unavailableQuestWarningsRef, (questIds) => {
        const activeQuestIds = new Set(normalizedState.questIds);
        const next = new Set<number>();
        for (const questId of questIds) {
          if (activeQuestIds.has(questId)) {
            next.add(questId);
          }
        }
        return next;
      });
    });

  const invokeState = (
    invoke: () => Promise<EnvironmentState>,
  ): Effect.Effect<EnvironmentState, unknown> =>
    Effect.tryPromise(invoke).pipe(Effect.tap((state) => setState(state)));

  const getState: EnvironmentShape["getState"] = () => Ref.get(stateRef);

  const clear: EnvironmentShape["clear"] = () =>
    invokeState(() => window.ipc.environment.clear());

  const addQuest: EnvironmentShape["addQuest"] = (questId, rewardItemId) =>
    invokeState(() => window.ipc.environment.addQuest(questId, rewardItemId));

  const removeQuest: EnvironmentShape["removeQuest"] = (questId) =>
    invokeState(() => window.ipc.environment.removeQuest(questId));

  const setQuestReward: EnvironmentShape["setQuestReward"] = (
    questId,
    rewardItemId,
  ) =>
    invokeState(() =>
      window.ipc.environment.setQuestReward(questId, rewardItemId),
    );

  const clearQuestReward: EnvironmentShape["clearQuestReward"] = (questId) =>
    invokeState(() => window.ipc.environment.clearQuestReward(questId));

  const clearQuests: EnvironmentShape["clearQuests"] = () =>
    invokeState(() => window.ipc.environment.clearQuests());

  const setQuestAutoRegister: EnvironmentShape["setQuestAutoRegister"] = (
    options,
  ) =>
    invokeState(() =>
      window.ipc.environment.setQuestAutoRegister(options),
    ).pipe(Effect.tap((state) => registerAllLoadedQuestDropTargets(state)));

  const setAutoRegisterRequirements: EnvironmentShape["setAutoRegisterRequirements"] =
    (requirements) =>
      getState().pipe(
        Effect.flatMap((state) =>
          setQuestAutoRegister({
            ...state.questAutoRegister,
            requirements,
          }),
        ),
      );

  const setAutoRegisterRewards: EnvironmentShape["setAutoRegisterRewards"] = (
    rewards,
  ) =>
    getState().pipe(
      Effect.flatMap((state) =>
        setQuestAutoRegister({
          ...state.questAutoRegister,
          rewards,
        }),
      ),
    );

  const addItem: EnvironmentShape["addItem"] = (name) =>
    invokeState(() => window.ipc.environment.addItem(name));

  const removeItem: EnvironmentShape["removeItem"] = (name) =>
    invokeState(() => window.ipc.environment.removeItem(name));

  const setItemRules: EnvironmentShape["setItemRules"] = (rules) =>
    invokeState(() => window.ipc.environment.setItemRules(rules));

  const setDropPolicy: EnvironmentShape["setDropPolicy"] = (policy) =>
    getState().pipe(
      Effect.flatMap((state) =>
        setItemRules(patchEnvironmentDropPolicy(state.itemRules, policy)),
      ),
    );

  const setAcceptAcMemberOnlyDrops: EnvironmentShape["setAcceptAcMemberOnlyDrops"] =
    (acceptAcMemberOnlyDrops) => setDropPolicy({ acceptAcMemberOnlyDrops });

  const setAcceptAcNonMemberDrops: EnvironmentShape["setAcceptAcNonMemberDrops"] =
    (acceptAcNonMemberDrops) => setDropPolicy({ acceptAcNonMemberDrops });

  const setAcceptNonAcMemberOnlyDrops: EnvironmentShape["setAcceptNonAcMemberOnlyDrops"] =
    (acceptNonAcMemberOnlyDrops) =>
      setDropPolicy({ acceptNonAcMemberOnlyDrops });

  const setAcceptNonAcNonMemberDrops: EnvironmentShape["setAcceptNonAcNonMemberDrops"] =
    (acceptNonAcNonMemberDrops) => setDropPolicy({ acceptNonAcNonMemberDrops });

  const setRejectUnregisteredDrops: EnvironmentShape["setRejectUnregisteredDrops"] =
    (rejectUnregisteredDrops) => setDropPolicy({ rejectUnregisteredDrops });

  const clearItems: EnvironmentShape["clearItems"] = () =>
    invokeState(() => window.ipc.environment.clearItems());

  const addBoost: EnvironmentShape["addBoost"] = (name) =>
    invokeState(() => window.ipc.environment.addBoost(name));

  const removeBoost: EnvironmentShape["removeBoost"] = (name) =>
    invokeState(() => window.ipc.environment.removeBoost(name));

  const clearBoosts: EnvironmentShape["clearBoosts"] = () =>
    invokeState(() => window.ipc.environment.clearBoosts());

  const fetchBoosts: EnvironmentShape["fetchBoosts"] = () =>
    inventory.getItems().pipe(
      Effect.map((items) =>
        items
          .filter((item) => item.data.sType === "ServerUse")
          .map((item) => item.name),
      ),
      Effect.catchCause((cause) =>
        Effect.logError({
          message: "failed to fetch environment boosts",
          cause,
        }).pipe(Effect.as([])),
      ),
    );

  const syncToAll: EnvironmentShape["syncToAll"] = () =>
    invokeState(() => window.ipc.environment.syncToAll());

  const registerQuestDropTargets = (state: EnvironmentState, questId: number) =>
    Effect.gen(function* () {
      if (
        !state.questAutoRegister.rewards &&
        !state.questAutoRegister.requirements
      ) {
        return;
      }

      const tree = yield* quests.getTree();
      const quest = tree.get(questId);
      if (!quest) {
        return;
      }

      const itemNames = getQuestDropTargetNames(quest, state.questAutoRegister);

      for (const itemName of itemNames) {
        const currentState = yield* getState();
        if (hasEnvironmentItemName(currentState, itemName)) {
          continue;
        }

        yield* addItem(itemName).pipe(
          Effect.asVoid,
          Effect.catchCause((cause) =>
            Effect.logError({
              message: "failed to auto register quest drop target",
              questId,
              itemName,
              cause,
            }).pipe(Effect.asVoid),
          ),
        );
      }
    });

  const registerLoadedQuestDropTargets = (questIds: readonly number[]) =>
    Effect.gen(function* () {
      const state = yield* getState();
      for (const questId of questIds) {
        yield* registerQuestDropTargets(state, questId).pipe(
          Effect.catchCause((cause) =>
            Effect.logError({
              message: "environment quest drop target registration failed",
              questId,
              cause,
            }).pipe(Effect.asVoid),
          ),
        );
      }
    });

  const registerAllLoadedQuestDropTargets = (state: EnvironmentState) =>
    Effect.gen(function* () {
      if (
        !state.questAutoRegister.rewards &&
        !state.questAutoRegister.requirements
      ) {
        return;
      }

      const tree = yield* quests.getTree();
      for (const questId of tree.keys()) {
        yield* registerQuestDropTargets(state, questId).pipe(
          Effect.catchCause((cause) =>
            Effect.logError({
              message: "environment quest drop target registration failed",
              questId,
              cause,
            }).pipe(Effect.asVoid),
          ),
        );
      }
    });

  const didQuestAutoRegisterChange = (
    previous: EnvironmentState,
    next: EnvironmentState,
  ): boolean =>
    previous.questAutoRegister.requirements !==
      next.questAutoRegister.requirements ||
    previous.questAutoRegister.rewards !== next.questAutoRegister.rewards;

  const loadRegisteredQuestData = (state: EnvironmentState) =>
    Effect.gen(function* () {
      const tree = yield* quests.getTree();
      const unloadedQuestIds = state.questIds.filter(
        (questId) => !tree.has(questId),
      );
      if (unloadedQuestIds.length === 0) {
        return;
      }

      const loaded = yield* quests.loadMany([...unloadedQuestIds], true).pipe(
        Effect.timeoutOption(QUEST_ACTION_TIMEOUT),
        Effect.catchCause((cause) =>
          Effect.logError({
            message: "failed to load registered quest data",
            questIds: unloadedQuestIds,
            cause,
          }).pipe(Effect.as(Option.some(undefined))),
        ),
      );

      if (Option.isNone(loaded)) {
        yield* Effect.logWarning({
          message: "timed out loading registered quest data",
          questIds: unloadedQuestIds,
        });
      }
    });

  const warnQuestUnavailableOnce = (questId: number) =>
    Effect.gen(function* () {
      const shouldWarn = yield* Ref.modify(
        unavailableQuestWarningsRef,
        (questIds) => {
          if (questIds.has(questId)) {
            return [false, questIds] as const;
          }

          const next = new Set(questIds);
          next.add(questId);
          return [true, next] as const;
        },
      );

      if (!shouldWarn) {
        return;
      }

      yield* Effect.logWarning({
        message: "environment quest is unavailable; skipping accept",
        questId,
      });
    });

  const clearQuestUnavailableWarning = (questId: number) =>
    Ref.update(unavailableQuestWarningsRef, (questIds) => {
      if (!questIds.has(questId)) {
        return questIds;
      }

      const next = new Set(questIds);
      next.delete(questId);
      return next;
    });

  const determineQuestAutomationIntent = (
    state: EnvironmentState,
    questId: number,
  ) =>
    Effect.gen(function* () {
      yield* registerQuestDropTargets(state, questId).pipe(
        Effect.catchCause((cause) =>
          Effect.logError({
            message: "environment quest drop target registration failed",
            questId,
            cause,
          }).pipe(Effect.asVoid),
        ),
      );

      const inProgress = yield* quests
        .isInProgress(questId)
        .pipe(Effect.catchCause(() => Effect.succeed(false)));
      let canComplete = false;
      if (inProgress) {
        canComplete = yield* quests
          .canComplete(questId)
          .pipe(Effect.catchCause(() => Effect.succeed(false)));
      }

      const available = inProgress
        ? false
        : yield* quests
            .isAvailable(questId)
            .pipe(Effect.catchCause(() => Effect.succeed(false)));

      if (inProgress || available) {
        yield* clearQuestUnavailableWarning(questId);
      } else {
        yield* warnQuestUnavailableOnce(questId);
      }

      const rewardItemId = state.questRewards[questId];
      return createQuestAutomationIntent({
        questId,
        ...(rewardItemId === undefined ? {} : { rewardItemId }),
        inProgress,
        canComplete,
        available,
      });
    }).pipe(
      Effect.catchCause((cause) =>
        Cause.hasInterruptsOnly(cause)
          ? Effect.failCause(cause)
          : Effect.logError({
              message: "environment quest reconcile failed",
              questId,
              cause,
            }).pipe(Effect.as({ action: "none", questId } as const)),
      ),
    );

  const tryAcquireQuestAction = (key: string) =>
    SynchronizedRef.modify(inFlightQuestActionKeysRef, (keys) => {
      if (keys.has(key)) {
        return [false, keys] as const;
      }

      const next = new Set(keys);
      next.add(key);
      return [true, next] as const;
    });

  const releaseQuestAction = (key: string) =>
    SynchronizedRef.update(inFlightQuestActionKeysRef, (keys) => {
      if (!keys.has(key)) {
        return keys;
      }

      const next = new Set(keys);
      next.delete(key);
      return next;
    });

  const runQuestMutation = (intent: QuestAutomationIntent) => {
    if (intent.action === "none") {
      return Effect.void;
    }

    const key = getQuestActionKey(intent);
    if (key === undefined) {
      return Effect.void;
    }

    return Effect.gen(function* () {
      const now = Date.now();
      const failures = yield* Ref.get(questActionFailuresRef);
      if (!canRunQuestAction(failures, key, now)) {
        return;
      }

      if (!(yield* tryAcquireQuestAction(key))) {
        return;
      }

      yield* Effect.gen(function* () {
        if (intent.action === "accept") {
          const available = yield* quests
            .isAvailable(intent.questId)
            .pipe(Effect.catchCause(() => Effect.succeed(false)));

          if (!available) {
            yield* warnQuestUnavailableOnce(intent.questId);
            return;
          }

          yield* clearQuestUnavailableWarning(intent.questId);
        }

        yield* questMutationSemaphore.withPermits(1)(
          Effect.gen(function* () {
            const beforeDelay = Date.now();
            const lastMutationAt = yield* Ref.get(lastQuestMutationAtRef);
            const delayMs = getQuestMutationDelayMs(
              lastMutationAt,
              beforeDelay,
              QUEST_MUTATION_DELAY_MS,
            );
            if (delayMs > 0) {
              yield* Effect.sleep(`${delayMs} millis`);
            }

            const startedAt = Date.now();
            yield* Ref.set(lastQuestMutationAtRef, startedAt);

            const effect =
              intent.action === "accept"
                ? quests.accept(intent.questId, true)
                : quests.complete(
                    intent.questId,
                    undefined,
                    intent.rewardItemId,
                  );

            const completed = yield* effect.pipe(
              Effect.timeoutOption(QUEST_ACTION_TIMEOUT),
              Effect.map(Option.isSome),
              Effect.catchCause((cause) =>
                Effect.logError({
                  message: "environment quest mutation failed",
                  questId: intent.questId,
                  action: intent.action,
                  cause,
                }).pipe(Effect.as(false)),
              ),
            );

            const finishedAt = Date.now();
            yield* Ref.update(questActionFailuresRef, (current) =>
              completed
                ? clearQuestActionFailure(current, key)
                : recordQuestActionFailure(current, key, finishedAt),
            );
          }),
        );
      }).pipe(Effect.ensuring(releaseQuestAction(key)));
    });
  };

  const runQuestAutomation = Effect.gen(function* () {
    const state = yield* getState();
    if (state.questIds.length === 0) {
      return;
    }

    yield* loadRegisteredQuestData(state);

    const intents = yield* Effect.forEach(
      state.questIds,
      (questId) => determineQuestAutomationIntent(state, questId),
      { concurrency: QUEST_RECONCILE_CONCURRENCY },
    );

    for (const intent of intents) {
      yield* runQuestMutation(intent);
    }
  });

  const runDropAutomation = Effect.gen(function* () {
    const state = yield* getState();
    const items = yield* drops.getDrops();

    for (const item of items) {
      const action = resolveEnvironmentDropAction(state, item);
      if (action === "accept") {
        yield* drops.acceptDrop(item.ItemID);
        continue;
      }

      if (action === "reject") {
        yield* drops.rejectDrop(item.ItemID);
      }
    }
  });

  const runBoostAutomation = Effect.gen(function* () {
    const state = yield* getState();
    if (state.boosts.length === 0) {
      return;
    }

    for (const boostName of state.boosts) {
      const item = yield* inventory
        .getItem(boostName)
        .pipe(Effect.catchCause(() => Effect.succeed(null)));
      if (!item || item.data.sType !== "ServerUse") {
        continue;
      }

      const boostType = boostTypeFromLink(item.data.sLink);
      if (boostType === undefined) {
        continue;
      }

      const active = yield* player
        .hasActiveBoost(boostType)
        .pipe(Effect.catchCause(() => Effect.succeed(true)));
      if (active) {
        continue;
      }

      yield* player.useBoost(item.name).pipe(Effect.asVoid);
      return;
    }
  });

  const runAutomationCycle = (
    key: string,
    cycle: Effect.Effect<void, unknown>,
  ) =>
    cycle.pipe(
      Effect.catchCause((cause) =>
        Cause.hasInterruptsOnly(cause)
          ? Effect.failCause(cause)
          : Effect.logError({
              message: "environment automation failed",
              key,
              cause,
            }).pipe(Effect.asVoid),
      ),
    );

  yield* jobs.startPeriodic(
    QUEST_JOB_KEY,
    QUEST_JOB_INTERVAL,
    runAutomationCycle(QUEST_JOB_KEY, runQuestAutomation),
    { runWhen: "loggedIn", runOnStart: false },
  );
  yield* jobs.startPeriodic(
    DROP_JOB_KEY,
    DROP_JOB_INTERVAL,
    runAutomationCycle(DROP_JOB_KEY, runDropAutomation),
    { runWhen: "loggedIn", runOnStart: false },
  );
  yield* jobs.startPeriodic(
    BOOST_JOB_KEY,
    BOOST_JOB_INTERVAL,
    runAutomationCycle(BOOST_JOB_KEY, runBoostAutomation),
    { runWhen: "loggedIn", runOnStart: false },
  );

  const removeStateListener = window.ipc.environment.onChanged((state) => {
    runFork(
      Effect.gen(function* () {
        const previous = yield* getState();
        yield* setState(state);
        if (didQuestAutoRegisterChange(previous, state)) {
          yield* registerAllLoadedQuestDropTargets(state);
        }
      }),
    );
  });
  const removeQuestLoadedListener = yield* quests.onLoaded((questIds) =>
    registerLoadedQuestDropTargets(questIds),
  );

  const removeFetchBoostsListener = window.ipc.environment.onFetchBoostsRequest(
    () => runPromise(fetchBoosts()),
  );

  void window.ipc.environment
    .getState()
    .then((state) => {
      runFork(
        setState(state).pipe(
          Effect.flatMap(() => registerAllLoadedQuestDropTargets(state)),
        ),
      );
    })
    .catch((error: unknown) => {
      console.error("Failed to load environment state:", error);
    });

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      removeStateListener();
      removeQuestLoadedListener();
      removeFetchBoostsListener();
    }),
  );

  return {
    getState,
    clear,
    addQuest,
    removeQuest,
    setQuestReward,
    clearQuestReward,
    clearQuests,
    setQuestAutoRegister,
    setAutoRegisterRequirements,
    setAutoRegisterRewards,
    addItem,
    removeItem,
    setAcceptAcMemberOnlyDrops,
    setAcceptAcNonMemberDrops,
    setAcceptNonAcMemberOnlyDrops,
    setAcceptNonAcNonMemberDrops,
    setRejectUnregisteredDrops,
    setDropPolicy,
    setItemRules,
    clearItems,
    addBoost,
    removeBoost,
    clearBoosts,
    fetchBoosts,
    syncToAll,
  } satisfies EnvironmentShape;
});

export const EnvironmentLive = Layer.effect(Environment, make);
