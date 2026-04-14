import { ServiceMap } from "effect";
import type { Effect } from "effect";
import type { ExtensionPacket } from "../PacketTypes";
import type { PacketListenerDisposer } from "./Packet";

export type PacketDomainEvent = "monsterDeath" | "zone" | "joinMap";

export interface PacketDomainMonsterDeathEvent {
  readonly monMapId: number;
  readonly packet: ExtensionPacket;
}

export interface PacketDomainZoneEvent {
  readonly zone: string;
  readonly map: string;
  readonly packet: ExtensionPacket;
}

export interface PacketDomainJoinMapEvent {
  readonly mapName?: string;
  readonly mapId?: number;
  readonly roomNumber?: number;
  readonly packet: ExtensionPacket;
}

export interface PacketDomainEventMap {
  monsterDeath: PacketDomainMonsterDeathEvent;
  zone: PacketDomainZoneEvent;
  joinMap: PacketDomainJoinMapEvent;
}

export type PacketDomainEventHandler<
  E extends PacketDomainEvent = PacketDomainEvent,
> = (event: PacketDomainEventMap[E]) => Effect.Effect<void>;

export interface PacketDomainShape {
  readonly started: true;
  // For semantic events derived from raw packet events
  on<E extends PacketDomainEvent>(
    event: E,
    handler: PacketDomainEventHandler<E>,
  ): Effect.Effect<PacketListenerDisposer>;
}

export class PacketDomain extends ServiceMap.Service<
  PacketDomain,
  PacketDomainShape
>()("flash/Services/PacketDomain") {}
