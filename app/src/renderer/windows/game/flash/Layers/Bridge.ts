import { Effect, Layer } from "effect";
import {
  SwfCallError,
  SwfMethodNotFoundError,
  SwfUnavailableError,
} from "../Errors";
import { bridgeFallbacks } from "../BridgeFallbacks";
import { Bridge, BridgeFailurePolicy } from "../Services/Bridge";
import type { BridgeError, BridgeShape } from "../Services/Bridge";

type WindowBridgeEventKey = "onConnection";

const setWindowBridgeHandler = (
  key: WindowBridgeEventKey,
  handler: (status: ConnectionStatus) => void,
): Effect.Effect<() => void> =>
  Effect.sync(() => {
    const win = window as Record<
      WindowBridgeEventKey,
      ((status: ConnectionStatus) => void) | undefined
    >;

    const previousHandler = win[key];

    const wrappedHandler = (status: ConnectionStatus) => {
      if (typeof status !== "string") {
        return;
      }

      previousHandler?.(status);
      handler(status);
    };

    win[key] = wrappedHandler;

    return () => {
      if (win[key] === wrappedHandler) {
        win[key] = previousHandler;
      }
    };
  });

const call = <K extends keyof Window["swf"]>(
  path: K,
  args?: Parameters<Window["swf"][K]>,
): Effect.Effect<ReturnType<Window["swf"][K]>, BridgeError> => {
  type TargetFunction = (
    ...args: Parameters<Window["swf"][K]>
  ) => ReturnType<Window["swf"][K]>;

  const method = String(path);
  const callArgs = (args ?? []) as Parameters<Window["swf"][K]>;

  return Effect.try<ReturnType<Window["swf"][K]>, BridgeError>({
    try: () => {
      const swf = window.swf;
      if (!swf) {
        throw new SwfUnavailableError({ method, args: callArgs });
      }

      const target = swf[path];
      if (typeof target !== "function") {
        throw new SwfMethodNotFoundError({ method, args: callArgs });
      }

      const fn = target as TargetFunction;
      return fn(...callArgs);
    },
    catch: (cause) => {
      if (
        cause instanceof SwfUnavailableError ||
        cause instanceof SwfMethodNotFoundError
      ) {
        return cause;
      }

      return new SwfCallError({ method, args: callArgs, cause });
    },
  }).pipe(
    Effect.catch((error) =>
      Effect.gen(function* () {
        const policy = yield* BridgeFailurePolicy;
        if (policy.mode === "strict") {
          return yield* error;
        }

        yield* policy.onFailure(error);
        const fallback = bridgeFallbacks[path] as () => ReturnType<
          Window["swf"][K]
        >;
        return fallback();
      }),
    ),
  );
};

const callGameFunction = (functionName: string, ...args: unknown[]) => {
  if (args.length > 0) {
    return call("flash.callGameFunction", [functionName, ...args]);
  }

  return call("flash.callGameFunction0", [functionName]);
};

const onConnection = (handler: (status: ConnectionStatus) => void) =>
  setWindowBridgeHandler("onConnection", handler);

const make = Effect.succeed({
  call,
  callGameFunction,
  onConnection,
} satisfies BridgeShape);

export const BridgeLive = Layer.effect(Bridge, make);
