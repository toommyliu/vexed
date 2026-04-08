import { Effect, Layer } from "effect";
import { Packet } from "../Services/Packet";
import type { PacketShape } from "../Services/Packet";

const make = Effect.gen(function* () {
  return {
    onExtensionResponse: (handler: (packet: string) => void) => {
      return Effect.sync(() => {
        window.onExtensionResponse = handler;
      });
    },
    packetFromClient: (handler: (packet: string) => void) => {
      return Effect.sync(() => {
        window.packetFromClient = handler;
      });
    },
    packetFromServer: (handler: (packet: string) => void) => {
      return Effect.sync(() => {
        window.packetFromServer = handler;
      });
    },
  } satisfies PacketShape;
});

export const PacketLive = Layer.effect(Packet, make);
