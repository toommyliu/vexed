import { Duration, Effect, Option, Schedule, SynchronizedRef } from "effect";

export type WaitForOptions = {
  readonly schedule?: Schedule.Schedule<unknown>;
  readonly timeout?: Duration.Input;
};

export const waitFor = <E>(
  effect: Effect.Effect<boolean, E>,
  options?: WaitForOptions,
): Effect.Effect<boolean, E> => {
  const awaited = Effect.repeat(effect, {
    until: (result) => result === true,
    schedule: options?.schedule ?? Schedule.spaced("100 millis"),
  }).pipe(Effect.as(true));

  if (options?.timeout === undefined) {
    return awaited;
  }

  return awaited.pipe(
    Effect.timeoutOption(options.timeout),
    Effect.map(Option.isSome),
  );
};

export const waitForRef = <A>(
  ref: SynchronizedRef.SynchronizedRef<A>,
  predicate: (a: A) => boolean,
  options?: WaitForOptions,
): Effect.Effect<boolean> =>
  waitFor(SynchronizedRef.get(ref).pipe(Effect.map(predicate)), options);
