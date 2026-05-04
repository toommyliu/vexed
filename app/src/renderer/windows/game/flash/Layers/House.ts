import { Effect, Layer } from "effect";
import { makeItemCache } from "../ItemCache";
import { Bridge } from "../Services/Bridge";
import { House } from "../Services/House";
import type { HouseShape } from "../Services/House";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const itemCache = yield* makeItemCache;

  const runFork = Effect.runForkWith(yield* Effect.services());

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(itemCache.clear);
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const getItem: HouseShape["getItem"] = (item) =>
    bridge
      .call("house.getItem", [item])
      .pipe(Effect.flatMap(itemCache.fromUnknown));

  const getItems: HouseShape["getItems"] = () =>
    bridge
      .call("house.getItems")
      .pipe(Effect.flatMap(itemCache.fromUnknownArray));

  const getSlots: HouseShape["getSlots"] = () => bridge.call("house.getSlots");

  const getUsedSlots: HouseShape["getUsedSlots"] = () =>
    bridge.call("house.getUsedSlots");

  const getAvailableSlots: HouseShape["getAvailableSlots"] = () =>
    Effect.zipWith(getSlots(), getUsedSlots(), (slots, used) => slots - used);

  return {
    getItem,
    getItems,
    getSlots,
    getUsedSlots,
    getAvailableSlots,
  } satisfies HouseShape;
});

export const HouseLive = Layer.effect(House, make);
