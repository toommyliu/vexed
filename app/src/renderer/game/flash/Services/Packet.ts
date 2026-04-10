import { ServiceMap } from "effect";
import type { Effect } from "effect";

export type PacketListenerDisposer = () => void;

export interface PacketShape {
  onExtensionResponse(
    handler: (packet: string) => void,
  ): Effect.Effect<PacketListenerDisposer>;
  packetFromClient(
    handler: (packet: string) => void,
  ): Effect.Effect<PacketListenerDisposer>;
  packetFromServer(
    handler: (packet: string) => void,
  ): Effect.Effect<PacketListenerDisposer>;
}

export class Packet extends ServiceMap.Service<Packet, PacketShape>()(
  "flash/Services/Packet",
) {}
