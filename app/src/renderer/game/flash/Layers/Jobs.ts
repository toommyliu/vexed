import { positiveInt } from "@vexed/shared/number";
import { Cause, Effect, Fiber, Layer, Ref, SynchronizedRef } from "effect";
import type { Duration } from "effect";
import { Bridge } from "../Services/Bridge";
import { Jobs } from "../Services/Jobs";
import { Player } from "../Services/Player";
import { Quests } from "../Services/Quests";
import { Settings } from "../Services/Settings";
import type {
  JobRunWhen,
  JobsShape,
  PeriodicJobDefinition,
  PeriodicJobStartOptions,
  QuestProgressJobOptions,
} from "../Services/Jobs";

type JobToken = number;

type JobEntry = {
  readonly token: JobToken;
  readonly fiber: Fiber.Fiber<void, unknown>;
};

type StartResult = {
  readonly started: boolean;
  readonly previous: Fiber.Fiber<void, unknown> | undefined;
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const player = yield* Player;
  const quests = yield* Quests;
  const settings = yield* Settings;

  const activeJobs = yield* SynchronizedRef.make<Map<string, JobEntry>>(
    new Map(),
  );
  const nextJobToken = yield* Ref.make<JobToken>(0);

  const unavailableQuestIds = yield* SynchronizedRef.make<Set<number>>(
    new Set(),
  );

  const clearUnavailableQuestIds = SynchronizedRef.update(
    unavailableQuestIds,
    (questIds) => {
      questIds.clear();
      return questIds;
    },
  );

  const isQuestUnavailable = (questId: number) =>
    SynchronizedRef.get(unavailableQuestIds).pipe(
      Effect.map((questIds) => questIds.has(questId)),
    );

  const markQuestUnavailable = (questId: number) =>
    SynchronizedRef.update(unavailableQuestIds, (questIds) => {
      questIds.add(questId);
      return questIds;
    });

  const runFork = Effect.runForkWith(yield* Effect.services());

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(clearUnavailableQuestIds);
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const removeIfCurrent = (key: string, token: JobToken) =>
    SynchronizedRef.update(activeJobs, (jobs) => {
      const current = jobs.get(key);
      if (current?.token === token) {
        jobs.delete(key);
      }

      return jobs;
    });

  const stop: JobsShape["stop"] = (key) =>
    Effect.gen(function* () {
      const previous = yield* SynchronizedRef.modify(activeJobs, (jobs) => {
        const current = jobs.get(key);
        if (current) {
          jobs.delete(key);
        }

        return [current?.fiber, jobs] as const;
      });

      if (!previous) {
        return false;
      }

      yield* Fiber.interrupt(previous);
      return true;
    });

  const stopAll: JobsShape["stopAll"] = () =>
    Effect.gen(function* () {
      const fibers = yield* SynchronizedRef.modify(activeJobs, (jobs) => {
        const current = Array.from(jobs.values(), (entry) => entry.fiber);
        jobs.clear();
        return [current, jobs] as const;
      });

      if (fibers.length === 0) {
        return;
      }

      yield* Effect.forEach(fibers, (fiber) => Fiber.interrupt(fiber), {
        discard: true,
      });
    });

  yield* Effect.addFinalizer(stopAll);

  const startInternal = (
    key: string,
    task: Effect.Effect<void, unknown>,
    replace: boolean,
  ): Effect.Effect<boolean> =>
    Effect.gen(function* () {
      const startResult: StartResult = yield* SynchronizedRef.modifyEffect(
        activeJobs,
        (jobs) =>
          Effect.gen(function* () {
            const current = jobs.get(key);
            if (current && !replace) {
              const result: StartResult = {
                started: false,
                previous: undefined,
              };
              return [result, jobs] as const;
            }

            const token = yield* Ref.updateAndGet(
              nextJobToken,
              (value) => Math.max(0, value) + 1,
            );

            const fiber = yield* Effect.forkDetach(
              task.pipe(Effect.ensuring(removeIfCurrent(key, token))),
            );

            jobs.set(key, { token, fiber });

            const result: StartResult = {
              started: true,
              previous: current?.fiber,
            };

            return [result, jobs] as const;
          }),
      );

      if (startResult.previous) {
        yield* Fiber.interrupt(startResult.previous);
      }

      return startResult.started;
    });

  const start: JobsShape["start"] = (key, task, options) =>
    startInternal(
      key,
      task.pipe(
        Effect.catchCause((cause) =>
          Cause.hasInterruptsOnly(cause)
            ? Effect.failCause(cause)
            : Effect.gen(function* () {
                yield* Effect.logError({
                  message: "job failed",
                  key,
                  cause,
                });
                return yield* Effect.failCause(cause);
              }),
        ),
      ),
      options?.replace ?? true,
    );

  const isRunWindowOpen = (runWhen: JobRunWhen) => {
    if (runWhen === "always") {
      return Effect.succeed(true);
    }

    return player.isReady().pipe(
      Effect.catchCause(() => Effect.succeed(false)),
      Effect.map((ready) => (runWhen === "loggedIn" ? ready : !ready)),
    );
  };

  const runPeriodic = (
    key: string,
    interval: Duration.Input,
    task: Effect.Effect<void, unknown>,
    options?: PeriodicJobStartOptions,
  ) => {
    const runOnStart = options?.runOnStart ?? true;
    const runWhen = options?.runWhen ?? "loggedIn";

    const runCycle = task.pipe(
      Effect.catchCause((cause) =>
        Cause.hasInterruptsOnly(cause)
          ? Effect.failCause(cause)
          : Effect.logError({
              message: "periodic job cycle failed",
              key,
              cause,
            }).pipe(Effect.asVoid),
      ),
    );

    const loop = Effect.gen(function* () {
      if (runOnStart && (yield* isRunWindowOpen(runWhen))) {
        yield* runCycle;
      }

      while (true) {
        yield* Effect.sleep(interval);

        if (!(yield* isRunWindowOpen(runWhen))) {
          continue;
        }

        yield* runCycle;
      }
    });

    return startInternal(key, loop, options?.replace ?? true);
  };

  const startPeriodic: JobsShape["startPeriodic"] = (
    key,
    interval,
    task,
    options,
  ) => runPeriodic(key, interval, task, options);

  const startPeriodicJob: JobsShape["startPeriodicJob"] = (definition) =>
    runPeriodic(
      definition.key,
      definition.interval,
      definition.task,
      definition,
    );

  const isRunning: JobsShape["isRunning"] = (key) =>
    SynchronizedRef.get(activeJobs).pipe(Effect.map((jobs) => jobs.has(key)));

  const getRunningKeys: JobsShape["getRunningKeys"] = () =>
    SynchronizedRef.get(activeJobs).pipe(
      Effect.map((jobs) => Array.from(jobs.keys()).sort()),
    );

  // Domain jobs

  const startQuestProgressJob = (options: QuestProgressJobOptions) => {
    const questId = positiveInt(options.questId);
    if (questId === undefined) {
      return Effect.logWarning({
        message: "quest progress job requires a valid quest id",
        questId: options.questId,
      }).pipe(Effect.as(false));
    }

    const key = options.key ?? `quest/progress/${questId}`;

    const task = Effect.gen(function* () {
      if (yield* isQuestUnavailable(questId)) {
        return;
      }

      const hasQuest = yield* quests.has(questId);
      if (!hasQuest) {
        yield* quests.load(questId, true);
      }

      const available = yield* quests.isAvailable(questId);
      if (!available) {
        yield* markQuestUnavailable(questId);
        return;
      }

      if (!(yield* quests.isInProgress(questId))) {
        yield* quests.accept(questId, true);
      }

      const canComplete = yield* quests.canComplete(questId);
      if (!canComplete) {
        return;
      }

      yield* quests.complete(
        questId,
        options.turnIns,
        options.itemId,
        options.special,
      );
    });

    return startPeriodicJob({
      key,
      interval: options.interval,
      task,
      runWhen: options.runWhen ?? "loggedIn",
      ...(options.replace !== undefined ? { replace: options.replace } : {}),
      ...(options.runOnStart !== undefined
        ? { runOnStart: options.runOnStart }
        : {}),
    });
  };

  yield* startQuestProgressJob({ questId: 11, interval: "500 millis" });

  const settingsApplyJobDefinition: PeriodicJobDefinition = {
    key: "settings/apply",
    interval: "500 millis",
    runOnStart: true,
    runWhen: "loggedIn",
    task: Effect.gen(function* () {
      const currentState = yield* settings.getState();
      yield* settings.apply(currentState);
    }),
  };

  yield* startPeriodicJob(settingsApplyJobDefinition);

  return {
    start,
    startPeriodic,
    startPeriodicJob,
    stop,
    stopAll,
    isRunning,
    getRunningKeys,
  } satisfies JobsShape;
});

export const JobsLive = Layer.effect(Jobs, make);
