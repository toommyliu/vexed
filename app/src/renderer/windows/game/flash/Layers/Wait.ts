import { Effect, Layer, Option, Schedule } from "effect";
import type { Duration } from "effect";
import { Bridge } from "../Services/Bridge";
import { Wait } from "../Services/Wait";
import type { WaitOptions, WaitShape } from "../Services/Wait";

const DEFAULT_GAME_ACTION_TIMEOUT: Duration.Input = "2 seconds";

class WaitPending {
  readonly _tag = "WaitPending";
}

const waitPending = new WaitPending();

const isWaitPending = (value: unknown): value is WaitPending =>
  value instanceof WaitPending;

const isWaitOptions = (
  value: WaitOptions | Duration.Input | undefined,
): value is WaitOptions => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const isPlainRecord =
    Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null;

  return (
    "timeout" in value ||
    "interval" in value ||
    "schedule" in value ||
    (isPlainRecord && Object.keys(value).length === 0)
  );
};

const normalizeOptions = (
  options: WaitOptions | Duration.Input | undefined,
): WaitOptions | undefined => {
  if (options === undefined) {
    return undefined;
  }

  return isWaitOptions(options) ? options : { timeout: options };
};

const normalizeGameActionOptions = (
  options: WaitOptions | Duration.Input | undefined,
): WaitOptions => {
  const normalized = normalizeOptions(options);

  return {
    ...normalized,
    timeout: normalized?.timeout ?? DEFAULT_GAME_ACTION_TIMEOUT,
  };
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const until: WaitShape["until"] = (condition, options) => {
    const awaited = Effect.repeat(condition, {
      until: (result) => result === true,
      schedule:
        options?.schedule ?? Schedule.spaced(options?.interval ?? "100 millis"),
    }).pipe(Effect.as(true));

    if (options?.timeout === undefined) {
      return awaited;
    }

    return awaited.pipe(
      Effect.timeoutOption(options.timeout),
      Effect.map(Option.isSome),
    );
  };

  const untilSome: WaitShape["untilSome"] = (condition, options) => {
    const schedule =
      options?.schedule ?? Schedule.spaced(options?.interval ?? "100 millis");
    const awaited = condition.pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(waitPending),
          onSome: (value) => Effect.succeed(Option.some(value)),
        }),
      ),
      Effect.retry({
        schedule,
        while: isWaitPending,
      }),
      Effect.catch((error) =>
        isWaitPending(error)
          ? Effect.succeed(Option.none())
          : Effect.fail(error),
      ),
    );

    if (options?.timeout === undefined) {
      return awaited;
    }

    return awaited.pipe(
      Effect.timeoutOption(options.timeout),
      Effect.map(Option.getOrElse(() => Option.none())),
    );
  };

  const isGameActionAvailable: WaitShape["isGameActionAvailable"] = (
    gameAction,
  ) => bridge.call("world.isActionAvailable", [gameAction]);

  const forGameAction: WaitShape["forGameAction"] = (gameAction, options) =>
    until(
      isGameActionAvailable(gameAction),
      normalizeGameActionOptions(options),
    );

  return {
    until,
    untilSome,
    isGameActionAvailable,
    forGameAction,
  } satisfies WaitShape;
});

export const WaitLive = Layer.effect(Wait, make);
