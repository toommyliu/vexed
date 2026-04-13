import { ServiceMap } from "effect";
import type { Effect } from "effect";

export type PacketListenerDisposer = () => void;

export type PacketListener = (
  packet: string,
) => Effect.Effect<unknown, unknown, never>;

export interface PacketShape {
  onExtensionResponse(
    handler: PacketListener,
  ): Effect.Effect<PacketListenerDisposer>;
  packetFromClient(handler: PacketListener): Effect.Effect<PacketListenerDisposer>;
  packetFromServer(handler: PacketListener): Effect.Effect<PacketListenerDisposer>;
}

export class Packet extends ServiceMap.Service<Packet, PacketShape>()(
  "flash/Services/Packet",
) {}
