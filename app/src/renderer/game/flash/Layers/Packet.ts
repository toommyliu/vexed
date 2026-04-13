import { Effect, Layer } from "effect";
import { Packet } from "../Services/Packet";
import type { PacketListener, PacketShape } from "../Services/Packet";

type WindowPacketHandlerKey =
  | "onExtensionResponse"
  | "packetFromClient"
  | "packetFromServer";

const normalizePacketInput = (input: unknown): string | null => {
  if (typeof input === "string") {
    return input;
  }

  if (Array.isArray(input) && typeof input[0] === "string") {
    return input[0];
  }

  return null;
};

const setWindowPacketHandler = (
  runFork: (effect: Effect.Effect<unknown, unknown, never>) => unknown,
  key: WindowPacketHandlerKey,
  handler: PacketListener,
): Effect.Effect<() => void> =>
  Effect.sync(() => {
    const win = window as Record<
      WindowPacketHandlerKey,
      ((packet: string) => void) | undefined
    >;

    const previousHandler = win[key];

    const wrappedHandler = (raw: unknown) => {
      const packet = normalizePacketInput(raw);
      if (packet === null) {
        return;
      }

      runFork(
        handler(packet).pipe(
          Effect.asVoid,
          Effect.catchCause((cause) =>
            Effect.logError({
              message: "packet listener failed",
              channel: key,
              cause,
            }),
          ),
        ),
      );
    };

    const wrappedForWindow = wrappedHandler as (packet: string) => void;
    win[key] = wrappedForWindow;

    return () => {
      if (win[key] === wrappedForWindow) {
        win[key] = previousHandler;
      }
    };
  });

const make = Effect.gen(function* () {
  const runFork = Effect.runForkWith(yield* Effect.services());

  return {
    onExtensionResponse: (handler) =>
      setWindowPacketHandler(runFork, "onExtensionResponse", handler),
    packetFromClient: (handler) =>
      setWindowPacketHandler(runFork, "packetFromClient", handler),
    packetFromServer: (handler) =>
      setWindowPacketHandler(runFork, "packetFromServer", handler),
  } satisfies PacketShape;
});

export const PacketLive = Layer.effect(Packet, make);
