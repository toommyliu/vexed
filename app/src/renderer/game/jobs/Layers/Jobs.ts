import { Cause, Effect, Fiber, Layer, Ref, SynchronizedRef } from "effect";
import type { Duration } from "effect";
import { JobGate } from "../Services/JobGate";
import { Jobs } from "../Services/Jobs";
import type { JobRunWhen } from "../Services/JobGate";
import type {
  JobsShape,
  PeriodicJobStartOptions,
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
  const jobGate = yield* JobGate;

  const activeJobs = yield* SynchronizedRef.make<Map<string, JobEntry>>(
    new Map(),
  );
  const nextJobToken = yield* Ref.make<JobToken>(0);

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

    return jobGate.isOpen(runWhen);
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
