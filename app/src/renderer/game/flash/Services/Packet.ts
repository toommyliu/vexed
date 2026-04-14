import { ServiceMap } from "effect";
import type { Effect, Scope } from "effect";
import type {
  ClientPacket,
  ExtensionPacket,
  ServerPacket,
} from "../PacketTypes";

export type PacketListenerDisposer = () => void;

export type PacketListener = (
  packet: string,
) => Effect.Effect<unknown, unknown, never>;

export type ClientPacketHandler = (packet: ClientPacket) => Effect.Effect<void>;

export type ServerPacketHandler = (packet: ServerPacket) => Effect.Effect<void>;

export type ExtensionPacketHandler = (
  packet: ExtensionPacket,
) => Effect.Effect<void>;

export interface PacketShape {
  onExtensionResponse(
    handler: PacketListener,
  ): Effect.Effect<PacketListenerDisposer>;
  packetFromClient(
    handler: PacketListener,
  ): Effect.Effect<PacketListenerDisposer>;
  packetFromServer(
    handler: PacketListener,
  ): Effect.Effect<PacketListenerDisposer>;

  client(
    cmd: string,
    handler: ClientPacketHandler,
  ): Effect.Effect<PacketListenerDisposer>;
  server(
    cmd: string,
    handler: ServerPacketHandler,
  ): Effect.Effect<PacketListenerDisposer>;
  extension(
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<PacketListenerDisposer>;
  extensionType(
    packetType: ExtensionPacket["packetType"],
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<PacketListenerDisposer>;
  json(
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<PacketListenerDisposer>;
  str(
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<PacketListenerDisposer>;

  scoped(
    registration: Effect.Effect<PacketListenerDisposer>,
  ): Effect.Effect<void, never, Scope.Scope>;
  clientScoped(
    cmd: string,
    handler: ClientPacketHandler,
  ): Effect.Effect<void, never, Scope.Scope>;
  serverScoped(
    cmd: string,
    handler: ServerPacketHandler,
  ): Effect.Effect<void, never, Scope.Scope>;
  extensionScoped(
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<void, never, Scope.Scope>;
  extensionTypeScoped(
    packetType: ExtensionPacket["packetType"],
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<void, never, Scope.Scope>;
  jsonScoped(
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<void, never, Scope.Scope>;
  strScoped(
    cmd: string,
    handler: ExtensionPacketHandler,
  ): Effect.Effect<void, never, Scope.Scope>;
}

export class Packet extends ServiceMap.Service<Packet, PacketShape>()(
  "flash/Services/Packet",
) {}
