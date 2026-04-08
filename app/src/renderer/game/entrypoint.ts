import { Effect, Stream } from "effect";
import { PacketRouter } from "./flash/Services/PacketRouter";
import { FlashLive } from "./flash/Layers/Flash";

window.onLoaded = () => {
  void Effect.runPromise(
    Effect.gen(function* () {
      const router = yield* PacketRouter;

      yield* Stream.runForEach(
        Stream.filter(router.clientPackets, (p) => p.cmd === "acceptQuest"),
        (p) => Effect.sync(() => console.log("Accept quest:", p))
      );

      yield* Stream.runForEach(
        router.serverPackets,
        (p) => Effect.sync(() => console.log("CT packet:", p))
      );

      yield* Stream.runForEach(
        router.extensionPackets,
        (p) => Effect.sync(() => console.log("Extension packet:", p))
      );
    }).pipe(Effect.provide(FlashLive))
  );
}