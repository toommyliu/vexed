import { Effect } from "effect";
import { expect, test } from "vitest";
import { makeScriptAsyncScope } from "./scriptAsyncScope";

test("requestInterrupt rejects in-flight script promises", async () => {
  const scope = makeScriptAsyncScope(Effect.runFork);
  const promise = scope.runPromise(Effect.never);

  await Effect.runPromise(scope.requestInterrupt("test stop"));

  await expect(promise).rejects.toMatchObject({
    name: "AbortError",
    message: "script execution was cancelled: test stop",
  });
});

test("close drains registered cleanup exactly once", async () => {
  const scope = makeScriptAsyncScope(Effect.runFork);
  let cleanupRuns = 0;

  await Effect.runPromise(
    scope.setCleanup(
      "listener",
      Effect.sync(() => {
        cleanupRuns += 1;
      }),
    ),
  );

  await Effect.runPromise(scope.close("first close"));
  await Effect.runPromise(scope.close("second close"));

  expect(cleanupRuns).toBe(1);
});

test("setCleanup runs a late cleanup immediately after cancellation", async () => {
  const scope = makeScriptAsyncScope(Effect.runFork);
  let cleanupRuns = 0;

  await Effect.runPromise(scope.requestInterrupt("stopped"));
  await Effect.runPromise(
    scope.setCleanup(
      "late",
      Effect.sync(() => {
        cleanupRuns += 1;
      }),
    ),
  );

  expect(cleanupRuns).toBe(1);
});
