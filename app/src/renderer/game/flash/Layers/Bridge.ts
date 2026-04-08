import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import type { BridgeShape } from "../Services/Bridge";

const make = Effect.gen(function* () {
  return {
    call: <K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) => {
      type TargetFunction = (
        ...args: Parameters<Window["swf"][K]>
      ) => ReturnType<Window["swf"][K]>;
      return Effect.sync(() => {
        const fn = window.swf[path] as TargetFunction;
        return fn(...(args ?? [] as Parameters<Window["swf"][K]>));
      });
    },
  } satisfies BridgeShape;
});

export const BridgeLive = Layer.effect(Bridge, make);
