import { ServiceMap } from "effect";
import type { Effect, Stream } from "effect";
import type {
  ClientPacket,
  ExtensionPacket,
  ParsedPacket,
  ServerPacket,
} from "../PacketTypes";

export interface PacketRouterShape {
  packets: Stream.Stream<ParsedPacket>;
  clientPackets: Stream.Stream<ClientPacket>;
  serverPackets: Stream.Stream<ServerPacket>;
  extensionPackets: Stream.Stream<ExtensionPacket>;
  emit(packet: ParsedPacket): Effect.Effect<void>;
}

export class PacketRouter extends ServiceMap.Service<
  PacketRouter,
  PacketRouterShape
>()("flash/Services/PacketRouter") {}
