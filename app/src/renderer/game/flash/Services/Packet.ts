import { ServiceMap } from "effect";
import type { Effect } from "effect";

export interface PacketShape {
  onExtensionResponse(handler: (packet: string) => void): Effect.Effect<void>;
  packetFromClient(handler: (packet: string) => void): Effect.Effect<void>;
  packetFromServer(handler: (packet: string) => void): Effect.Effect<void>;
}

export class Packet extends ServiceMap.Service<
  Packet,
  PacketShape
>()("flash/Services/Packet") {}
