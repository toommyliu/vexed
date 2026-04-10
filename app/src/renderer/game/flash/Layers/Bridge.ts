import { Effect, Layer } from "effect";
import {
  SwfCallError,
  SwfMethodNotFoundError,
  SwfUnavailableError,
} from "../Errors";
import { Bridge } from "../Services/Bridge";
import type { BridgeError, BridgeShape } from "../Services/Bridge";

type WindowBridgeEventKey = "onConnection";

const setWindowBridgeHandler = (
  key: WindowBridgeEventKey,
  handler: (status: string) => void,
): Effect.Effect<() => void> =>
  Effect.sync(() => {
    const win = window as Record<
      WindowBridgeEventKey,
      ((status: string) => void) | undefined
    >;

    const previousHandler = win[key];

    const wrappedHandler = (status: unknown) => {
      if (typeof status !== "string") {
        return;
      }

      previousHandler?.(status);
      handler(status);
    };

    const wrappedForWindow = wrappedHandler as (status: string) => void;
    win[key] = wrappedForWindow;

    return () => {
      if (win[key] === wrappedForWindow) {
        win[key] = previousHandler;
      }
    };
  });

const make = Effect.succeed({
  call: <K extends keyof Window["swf"]>(
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
          throw new SwfUnavailableError({ method });
        }

        const target = swf[path];
        if (typeof target !== "function") {
          throw new SwfMethodNotFoundError({ method });
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

        return new SwfCallError({ method, cause });
      },
    });
  },
  onConnection: (handler: (status: string) => void) =>
    setWindowBridgeHandler("onConnection", handler),
} satisfies BridgeShape);

export const BridgeLive = Layer.effect(Bridge, make);
