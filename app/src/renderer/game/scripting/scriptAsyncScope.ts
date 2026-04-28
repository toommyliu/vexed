import { Cause, Effect, Exit, Fiber } from "effect";

type AnyFiber = Fiber.Fiber<unknown, unknown>;
type CleanupEffect = Effect.Effect<void, unknown>;

type RunFork = <A, E>(
  effect: Effect.Effect<A, E>,
  options?: Effect.RunOptions,
) => Fiber.Fiber<A, E>;

const cancellationMessage = (reason?: string): string =>
  reason
    ? `script execution was cancelled: ${reason}`
    : "script execution was cancelled";

export const makeScriptCancellationError = (reason?: string): Error => {
  const error = new Error(cancellationMessage(reason));
  error.name = "AbortError";
  return error;
};

export interface ScriptAsyncScope {
  readonly signal: AbortSignal;
  isCancelled(): boolean;
  runPromise<A, E>(effect: Effect.Effect<A, E>): Promise<A>;
  setCleanup(key: string, cleanup: CleanupEffect): Effect.Effect<void>;
  removeCleanup(key: string): Effect.Effect<void>;
  interrupt(reason?: string): Effect.Effect<void>;
}

export const makeScriptAsyncScope = (runFork: RunFork): ScriptAsyncScope => {
  const controller = new AbortController();
  const fibers = new Set<AnyFiber>();
  const cleanups = new Map<string, CleanupEffect>();
  let cancelled = false;
  let cancellationReason: string | undefined;

  const isCancelled = () => cancelled || controller.signal.aborted;

  const rejectCancelled = <A>(): Promise<A> =>
    Promise.reject(makeScriptCancellationError(cancellationReason));

  const runPromise: ScriptAsyncScope["runPromise"] = (effect) => {
    if (isCancelled()) {
      return rejectCancelled();
    }

    const fiber = runFork(effect, { signal: controller.signal });
    fibers.add(fiber as AnyFiber);

    return new Promise((resolve, reject) => {
      const removeObserver = fiber.addObserver((exit) => {
        removeObserver();
        fibers.delete(fiber as AnyFiber);

        if (Exit.isSuccess(exit)) {
          if (isCancelled()) {
            reject(makeScriptCancellationError(cancellationReason));
            return;
          }

          resolve(exit.value);
          return;
        }

        if (isCancelled() || Exit.hasInterrupts(exit)) {
          reject(makeScriptCancellationError(cancellationReason));
          return;
        }

        reject(
          Cause.squash(
            (exit as { readonly cause: Cause.Cause<unknown> }).cause,
          ),
        );
      });
    });
  };

  const runCleanup = (cleanup: CleanupEffect) =>
    cleanup.pipe(
      Effect.catchCause((cause) =>
        Cause.hasInterruptsOnly(cause)
          ? Effect.void
          : Effect.logError({
              message: "script cleanup failed",
              cause,
            }),
      ),
    );

  const setCleanup: ScriptAsyncScope["setCleanup"] = (key, cleanup) =>
    Effect.gen(function* () {
      const previous = cleanups.get(key);
      if (previous) {
        yield* runCleanup(previous);
      }

      cleanups.set(key, cleanup);
    });

  const removeCleanup: ScriptAsyncScope["removeCleanup"] = (key) =>
    Effect.gen(function* () {
      const previous = cleanups.get(key);
      cleanups.delete(key);

      if (previous) {
        yield* runCleanup(previous);
      }
    });

  const interrupt: ScriptAsyncScope["interrupt"] = (reason) =>
    Effect.gen(function* () {
      if (!cancelled) {
        cancelled = true;
        cancellationReason = reason;
        controller.abort(makeScriptCancellationError(reason));
      }

      const activeFibers = [...fibers];
      for (const fiber of activeFibers) {
        fiber.interruptUnsafe();
      }

      const cleanupEffects = [...cleanups.values()];
      cleanups.clear();

      yield* Effect.forEach(cleanupEffects, (cleanup) => runCleanup(cleanup), {
        discard: true,
      });
    });

  return {
    signal: controller.signal,
    isCancelled,
    runPromise,
    setCleanup,
    removeCleanup,
    interrupt,
  };
};
