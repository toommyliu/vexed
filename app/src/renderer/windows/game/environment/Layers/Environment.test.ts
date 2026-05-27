import { Collection } from "@vexed/collection";
import { Quest, type QuestInfo } from "@vexed/game";
import { createEmptyEnvironmentState } from "../../../../../shared/environment";
import { Effect, Layer, Logger } from "effect";
import { describe, expect, test } from "vitest";
import { Drops, type DropsShape } from "../../flash/Services/Drops";
import { Inventory, type InventoryShape } from "../../flash/Services/Inventory";
import { Player, type PlayerShape } from "../../flash/Services/Player";
import { Quests, type QuestsShape } from "../../flash/Services/Quests";
import { Jobs, type JobsShape } from "../../jobs/Services/Jobs";
import { Environment, type EnvironmentShape } from "../Services/Environment";
import { EnvironmentLive } from "./Environment";

const QUEST_JOB_KEY = "environment/quests";

const questInfo = (questId: number): QuestInfo =>
  ({
    QuestID: String(questId),
    RequiredItems: [],
    Rewards: [],
    oItems: {},
    oRewards: {},
    reward: [],
    sName: `Quest ${questId}`,
  }) as unknown as QuestInfo;

interface EnvironmentHarness {
  readonly acceptedQuestIds: readonly number[];
  readonly logs: readonly unknown[];
  readonly runQuestCycle: () => Effect.Effect<void, unknown>;
  readonly setAvailableResults: (results: readonly boolean[]) => void;
  readonly setInProgress: (value: boolean) => void;
}

const withEnvironment = (
  body: (
    environment: EnvironmentShape,
    harness: EnvironmentHarness,
  ) => Effect.Effect<void, unknown>,
) => {
  const acceptedQuestIds: number[] = [];
  const logs: unknown[] = [];
  const periodicTasks = new Map<string, Effect.Effect<void, unknown>>();
  let availableResults: boolean[] = [];
  let inProgress = false;
  let state = {
    ...createEmptyEnvironmentState(),
    questIds: [609],
  };

  const questTree = new Collection<number, Quest>();
  questTree.set(609, new Quest(questInfo(609)));

  const previousWindow = globalThis.window;
  const hadWindow = "window" in globalThis;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      ipc: {
        environment: {
          addBoost: async () => state,
          addItem: async () => state,
          addQuest: async () => state,
          clear: async () => state,
          clearBoosts: async () => state,
          clearItems: async () => state,
          clearQuestReward: async () => state,
          clearQuests: async () => state,
          getState: async () => state,
          onChanged: () => () => undefined,
          onFetchBoostsRequest: () => () => undefined,
          removeBoost: async () => state,
          removeItem: async () => state,
          removeQuest: async () => state,
          setItemRules: async () => state,
          setQuestAutoRegister: async () => state,
          setQuestReward: async () => state,
          syncToAll: async () => state,
        },
      },
    },
  });

  const drops = {
    acceptDrop: () => Effect.void,
    containsDrop: () => Effect.succeed(false),
    getDrops: () => Effect.succeed([]),
    isUsingCustomDrops: () => Effect.succeed(false),
    rejectDrop: () => Effect.succeed(false),
    toggleUi: () => Effect.void,
  } satisfies DropsShape;

  const inventory = {
    contains: () => Effect.succeed(false),
    equip: () => Effect.succeed(false),
    getAvailableSlots: () => Effect.succeed(0),
    getItem: () => Effect.succeed(null),
    getItems: () => Effect.succeed([]),
    getSlots: () => Effect.succeed(0),
    getUsedSlots: () => Effect.succeed(0),
  } satisfies InventoryShape;

  const jobs = {
    getRunningKeys: () => Effect.succeed(Array.from(periodicTasks.keys())),
    isRunning: (key: string) => Effect.succeed(periodicTasks.has(key)),
    start: () => Effect.succeed(true),
    startPeriodic: (key, _interval, task) =>
      Effect.sync(() => {
        periodicTasks.set(key, task);
        return true;
      }),
    startPeriodicJob: (definition) =>
      Effect.sync(() => {
        periodicTasks.set(definition.key, definition.task);
        return true;
      }),
    stop: (key: string) =>
      Effect.sync(() => {
        const hadTask = periodicTasks.has(key);
        periodicTasks.delete(key);
        return hadTask;
      }),
    stopAll: () =>
      Effect.sync(() => {
        periodicTasks.clear();
      }),
  } satisfies JobsShape;

  const player = {
    hasActiveBoost: () => Effect.succeed(true),
    useBoost: () => Effect.succeed(false),
  } as unknown as PlayerShape;

  const quests = {
    abandon: () => Effect.void,
    accept: (questId: number) =>
      Effect.sync(() => {
        acceptedQuestIds.push(questId);
      }),
    canComplete: () => Effect.succeed(false),
    complete: () => Effect.void,
    getAccepted: () => Effect.succeed([]),
    getMaxTurnIns: () => Effect.succeed(1),
    getTree: () => Effect.succeed(questTree),
    has: (questId: number) => Effect.succeed(questTree.has(questId)),
    isAvailable: () =>
      Effect.sync(() => availableResults.shift() ?? false),
    isInProgress: () => Effect.succeed(inProgress),
    load: () => Effect.void,
    loadMany: () => Effect.void,
    onLoaded: () => Effect.succeed(() => undefined),
  } satisfies QuestsShape;

  const testLogger = Logger.make<unknown, void>((options) => {
    if (Array.isArray(options.message)) {
      logs.push(...options.message);
      return;
    }

    logs.push(options.message);
  });

  const harness: EnvironmentHarness = {
    acceptedQuestIds,
    logs,
    runQuestCycle: () =>
      periodicTasks.get(QUEST_JOB_KEY) ?? Effect.void.pipe(Effect.asVoid),
    setAvailableResults(results) {
      availableResults = [...results];
    },
    setInProgress(value) {
      inProgress = value;
    },
  };

  const TestLive = Layer.merge(
    Logger.layer([testLogger]),
    EnvironmentLive.pipe(
      Layer.provide(
        Layer.mergeAll(
          Layer.succeed(Drops)(drops),
          Layer.succeed(Inventory)(inventory),
          Layer.succeed(Jobs)(jobs),
          Layer.succeed(Player)(player),
          Layer.succeed(Quests)(quests),
        ),
      ),
    ),
  );

  return Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const environment = yield* Environment;
        yield* environment.addQuest(609);
        yield* body(environment, harness);
      }),
    ).pipe(
      Effect.provide(TestLive),
      Effect.ensuring(
        Effect.sync(() => {
          if (hadWindow) {
            Object.defineProperty(globalThis, "window", {
              configurable: true,
              value: previousWindow,
            });
          } else {
            Reflect.deleteProperty(globalThis, "window");
          }
        }),
      ),
    ),
  );
};

describe("environment quest automation", () => {
  test("skips accept when a quest becomes unavailable before mutation", async () => {
    await withEnvironment((_environment, harness) =>
      Effect.gen(function* () {
        harness.setAvailableResults([true, false]);

        yield* harness.runQuestCycle();

        expect(harness.acceptedQuestIds).toEqual([]);
        expect(harness.logs).toEqual([
          {
            message: "environment quest is unavailable; skipping accept",
            questId: 609,
          },
        ]);
      }),
    );
  });

  test("warns once per unavailable period and resets when the quest is actionable", async () => {
    await withEnvironment((_environment, harness) =>
      Effect.gen(function* () {
        harness.setAvailableResults([false]);
        yield* harness.runQuestCycle();

        harness.setAvailableResults([false]);
        yield* harness.runQuestCycle();

        harness.setInProgress(true);
        yield* harness.runQuestCycle();

        harness.setInProgress(false);
        harness.setAvailableResults([false]);
        yield* harness.runQuestCycle();

        expect(harness.acceptedQuestIds).toEqual([]);
        expect(harness.logs).toEqual([
          {
            message: "environment quest is unavailable; skipping accept",
            questId: 609,
          },
          {
            message: "environment quest is unavailable; skipping accept",
            questId: 609,
          },
        ]);
      }),
    );
  });
});
