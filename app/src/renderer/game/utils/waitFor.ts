import { Effect, Schedule, SynchronizedRef } from "effect";

export const waitFor = <E>(
  effect: Effect.Effect<boolean, E>,
  options?: {
    schedule?: Schedule.Schedule<unknown>;
  },
): Effect.Effect<void, E> =>
  Effect.asVoid(
    Effect.repeat(effect, {
      until: (result) => result === true,
      schedule: options?.schedule ?? Schedule.spaced("100 millis"),
    }),
  );

export const waitForRef = <A>(
  ref: SynchronizedRef.SynchronizedRef<A>,
  predicate: (a: A) => boolean,
  options?: {
    schedule?: Schedule.Schedule<unknown>;
  },
): Effect.Effect<void> =>
  waitFor(SynchronizedRef.get(ref).pipe(Effect.map(predicate)), options);
