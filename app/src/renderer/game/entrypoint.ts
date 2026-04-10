import { Effect } from "effect";
import { FlashLive } from "./flash/Layers/Flash";
import { PacketHandler } from "./flash/Services/PacketHandler";

window.onLoaded = () => {
  void Effect.runPromise(
    Effect.gen(function* () {
      const packetHandler = yield* PacketHandler;

      yield* packetHandler.registerClient("acceptQuest", (packet) =>
        Effect.sync(() => {
          console.log("Accept quest:", packet);
        }),
      );

      yield* packetHandler.registerServer("ct", (packet) =>
        Effect.sync(() => {
          console.log("CT packet:", packet);
        }),
      );

      yield* packetHandler.registerExtensionType("json", "dropItem", (packet) =>
        Effect.sync(() => {
          console.log("Drop item packet:", packet);
        }),
      );

      return yield* Effect.never;
    }).pipe(Effect.provide(FlashLive)),
  );
};
