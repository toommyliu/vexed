import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Drops } from "../Services/Drops";
import type { DropsShape } from "../Services/Drops";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    acceptDrop: (itemId: number) => bridge.call("drops.acceptDrop", [itemId]),
    getDrops: () => bridge.call("drops.getDrops"),
    getItems: () => bridge.call("drops.getItems"),
    isUsingCustomDrops: () => bridge.call("drops.isUsingCustomDrops"),
    rejectDrop: (itemId: number) => bridge.call("drops.rejectDrop", [itemId]),
    toggleUi: () => bridge.call("drops.toggleUi"),
  } satisfies DropsShape;
});

export const DropsLive = Layer.effect(Drops, make);
