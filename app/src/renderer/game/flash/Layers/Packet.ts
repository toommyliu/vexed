import { Effect, Layer } from "effect";
import { Packet } from "../Services/Packet";
import type { PacketShape } from "../Services/Packet";

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
  key: WindowPacketHandlerKey,
  handler: (packet: string) => void,
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

      handler(packet);
    };

    const wrappedForWindow = wrappedHandler as (packet: string) => void;
    win[key] = wrappedForWindow;

    return () => {
      if (win[key] === wrappedForWindow) {
        win[key] = previousHandler;
      }
    };
  });

const make = Effect.succeed({
  onExtensionResponse: (handler: (packet: string) => void) =>
    setWindowPacketHandler("onExtensionResponse", handler),
  packetFromClient: (handler: (packet: string) => void) =>
    setWindowPacketHandler("packetFromClient", handler),
  packetFromServer: (handler: (packet: string) => void) =>
    setWindowPacketHandler("packetFromServer", handler),
} satisfies PacketShape);

export const PacketLive = Layer.effect(Packet, make);
