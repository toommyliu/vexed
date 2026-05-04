import { Data, Deferred, Effect, Layer, Option } from "effect";
import { TestClock } from "effect/testing";
import { expect, test } from "vitest";
import { JobGate, type JobGateShape } from "../Services/JobGate";
import { Jobs, type JobsShape } from "../Services/Jobs";
import { JobsLive } from "./Jobs";

class JobsTestError extends Data.TaggedError("JobsTestError")<{
  readonly message: string;
}> {}

const withJobs = async <A>(
  gate: JobGateShape,
  body: (jobs: JobsShape) => Effect.Effect<A, unknown>,
  options?: { readonly testClock?: boolean },
): Promise<A> =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const jobs = yield* Jobs;
        return yield* body(jobs);
      }),
    ).pipe(
      Effect.provide(
        options?.testClock === true
          ? Layer.mergeAll(
              JobsLive.pipe(Layer.provide(Layer.succeed(JobGate)(gate))),
              TestClock.layer(),
            )
          : JobsLive.pipe(Layer.provide(Layer.succeed(JobGate)(gate))),
      ),
    ),
  );

const openGate = {
  isOpen: () => Effect.succeed(true),
} satisfies JobGateShape;

test("one-shot job starts and unregisters after completion", async () => {
  await withJobs(openGate, (jobs) =>
    Effect.gen(function* () {
      const completed = yield* Deferred.make<void>();

      const started = yield* jobs.start(
        "once",
        Deferred.succeed(completed, undefined).pipe(Effect.asVoid),
      );
      yield* Deferred.await(completed);
      yield* Effect.yieldNow;

      expect(started).toBe(true);
      expect(yield* jobs.isRunning("once")).toBe(false);
      expect(yield* jobs.getRunningKeys()).toEqual([]);
    }),
  );
});

test("duplicate job with replace false does not replace existing job", async () => {
  await withJobs(openGate, (jobs) =>
    Effect.gen(function* () {
      const firstInterrupted = yield* Deferred.make<void>();
      const secondStarted = yield* Deferred.make<void>();

      expect(
        yield* jobs.start(
          "same",
          Effect.never.pipe(
            Effect.onInterrupt(() =>
              Deferred.succeed(firstInterrupted, undefined).pipe(
                Effect.asVoid,
              ),
            ),
          ),
        ),
      ).toBe(true);

      expect(
        yield* jobs.start(
          "same",
          Deferred.succeed(secondStarted, undefined).pipe(Effect.asVoid),
          { replace: false },
        ),
      ).toBe(false);

      yield* Effect.yieldNow;
      expect(Option.isNone(yield* Deferred.poll(firstInterrupted))).toBe(true);
      expect(Option.isNone(yield* Deferred.poll(secondStarted))).toBe(true);
      expect(yield* jobs.isRunning("same")).toBe(true);
    }),
  );
});

test("duplicate job with default replacement interrupts previous job", async () => {
  await withJobs(openGate, (jobs) =>
    Effect.gen(function* () {
      let firstRuns = 0;
      let secondRuns = 0;

      yield* jobs.start(
        "same",
        Effect.gen(function* () {
          while (true) {
            firstRuns += 1;
            yield* Effect.sleep("10 millis");
          }
        }),
      );
      yield* Effect.sleep("25 millis");

      expect(
        yield* jobs.start(
          "same",
          Effect.gen(function* () {
            while (true) {
              secondRuns += 1;
              yield* Effect.sleep("10 millis");
            }
          }),
        ),
      ).toBe(true);

      const firstRunsAfterReplace = firstRuns;
      yield* Effect.sleep("35 millis");
      expect(firstRuns).toBe(firstRunsAfterReplace);
      expect(secondRuns).toBeGreaterThan(0);
      expect(yield* jobs.isRunning("same")).toBe(true);
    }),
  );
});

test("stop interrupts a running job", async () => {
  await withJobs(openGate, (jobs) =>
    Effect.gen(function* () {
      let runs = 0;

      yield* jobs.start(
        "running",
        Effect.gen(function* () {
          while (true) {
            runs += 1;
            yield* Effect.sleep("10 millis");
          }
        }),
      );
      yield* Effect.sleep("25 millis");

      expect(yield* jobs.stop("running")).toBe(true);
      const runsAfterStop = runs;
      yield* Effect.sleep("35 millis");
      expect(runs).toBe(runsAfterStop);
      expect(yield* jobs.isRunning("running")).toBe(false);
    }),
  );
});

test("stopAll interrupts all running jobs", async () => {
  await withJobs(openGate, (jobs) =>
    Effect.gen(function* () {
      let runsA = 0;
      let runsB = 0;

      yield* jobs.start(
        "a",
        Effect.gen(function* () {
          while (true) {
            runsA += 1;
            yield* Effect.sleep("10 millis");
          }
        }),
      );
      yield* jobs.start(
        "b",
        Effect.gen(function* () {
          while (true) {
            runsB += 1;
            yield* Effect.sleep("10 millis");
          }
        }),
      );
      yield* Effect.sleep("25 millis");

      yield* jobs.stopAll();
      const runsAfterStop = { a: runsA, b: runsB };
      yield* Effect.sleep("35 millis");
      expect(runsA).toBe(runsAfterStop.a);
      expect(runsB).toBe(runsAfterStop.b);
      expect(yield* jobs.getRunningKeys()).toEqual([]);
    }),
  );
});

test("periodic job respects runOnStart", async () => {
  await withJobs(
    openGate,
    (jobs) =>
      Effect.gen(function* () {
        let runs = 0;

        yield* jobs.startPeriodic(
          "periodic",
          "1 second",
          Effect.sync(() => {
            runs += 1;
          }),
          { runOnStart: false, runWhen: "always" },
        );
        yield* Effect.yieldNow;
        expect(runs).toBe(0);

        yield* TestClock.adjust("1 second");
        yield* Effect.yieldNow;
        expect(runs).toBe(1);
      }),
    { testClock: true },
  );
});

test("periodic job respects loggedIn and loggedOut through JobGate", async () => {
  let ready = false;
  const gate = {
    isOpen(runWhen) {
      return Effect.succeed(runWhen === "loggedIn" ? ready : !ready);
    },
  } satisfies JobGateShape;

  await withJobs(
    gate,
    (jobs) =>
      Effect.gen(function* () {
        let loggedInRuns = 0;
        let loggedOutRuns = 0;

        yield* jobs.startPeriodic(
          "loggedIn",
          "1 second",
          Effect.sync(() => {
            loggedInRuns += 1;
          }),
          { runOnStart: true, runWhen: "loggedIn" },
        );
        yield* jobs.startPeriodic(
          "loggedOut",
          "1 second",
          Effect.sync(() => {
            loggedOutRuns += 1;
          }),
          { runOnStart: true, runWhen: "loggedOut" },
        );

        yield* Effect.yieldNow;
        expect(loggedInRuns).toBe(0);
        expect(loggedOutRuns).toBe(1);

        ready = true;
        yield* TestClock.adjust("1 second");
        yield* Effect.yieldNow;
        expect(loggedInRuns).toBe(1);
        expect(loggedOutRuns).toBe(1);
      }),
    { testClock: true },
  );
});

test("periodic cycle failure is logged and swallowed while loop continues", async () => {
  await withJobs(
    openGate,
    (jobs) =>
      Effect.gen(function* () {
        let runs = 0;

        yield* jobs.startPeriodic(
          "flaky",
          "1 second",
          Effect.gen(function* () {
            runs += 1;
            if (runs === 1) {
              return yield* new JobsTestError({ message: "first cycle failed" });
            }
          }),
          { runOnStart: true, runWhen: "always" },
        );

        yield* Effect.yieldNow;
        expect(runs).toBe(1);

        yield* TestClock.adjust("1 second");
        yield* Effect.yieldNow;
        expect(runs).toBe(2);
        expect(yield* jobs.isRunning("flaky")).toBe(true);
      }),
    { testClock: true },
  );
});
