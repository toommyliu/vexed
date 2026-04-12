import { ServiceMap } from "effect";
import type { Effect } from "effect";
import type {
  ClientPacket,
  ExtensionPacket,
  ServerPacket,
} from "../PacketTypes";

export type PacketHandlerDisposer = () => void;

export type ClientPacketHandler = (packet: ClientPacket) => Effect.Effect<void>;

export type ServerPacketHandler = (packet: ServerPacket) => Effect.Effect<void>;

export type ExtensionPacketHandler = (
  packet: ExtensionPacket,
) => Effect.Effect<void>;

export interface PacketHandlerShape {
  registerClient(
    cmd: string,
    handler: ClientPacketHandler,
  ): Effect.Effect<PacketHandlerDisposer>;
  registerServer(
    cmd: string,
    handler: ServerPacketHandler,
  ): Effect.Effect<PacketHandlerDisposer>;
  registerExtension(
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<PacketHandlerDisposer>;
  registerExtensionType(
    packetType: ExtensionPacket["packetType"],
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<PacketHandlerDisposer>;
}

export class PacketHandler extends ServiceMap.Service<
  PacketHandler,
  PacketHandlerShape
>()("flash/Services/PacketHandler") {}
