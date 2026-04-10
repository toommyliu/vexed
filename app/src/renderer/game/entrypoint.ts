import { Effect } from "effect";
import { PacketHandler } from "./flash/Services/PacketHandler";
import { runtime } from "./flash/runtime";

window.onDebug = (message: string) => {
  console.debug('%c debug:: ', 'color:#7b8cde;font-size:11px;', message);
};

window.onLoaded = () => {
  void runtime.runPromise(
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
    }),
  );
};

window.onConnection = (status: string) => {
  console.log('root onConnection:', status);
};
