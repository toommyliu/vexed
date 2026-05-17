import { ServiceMap } from "effect";
import type { Effect } from "effect";
import type { Aura } from "@vexed/game";
import type { ExtensionPacket, ServerPacket } from "../PacketTypes";
import type { PacketListenerDisposer } from "./Packet";

export type PacketDomainEvent =
  | "monsterDeath"
  | "zone"
  | "joinMap"
  | "animationMessage"
  | "auraAdded"
  | "auraRemoved"
  | "counterAttackStart"
  | "counterAttackEnd";

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

export interface PacketDomainAnimationMessageEvent {
  readonly message: string;
  readonly monMapId?: number;
  readonly packet: ServerPacket;
}

export interface PacketDomainAuraEvent {
  readonly auraName: string;
  readonly targetId: number;
  readonly targetType: "monster" | "player";
  readonly aura?: Aura;
  readonly packet: ServerPacket;
}

export interface PacketDomainCounterAttackEvent {
  readonly monMapId: number;
  readonly source: "message" | "aura";
  readonly triggerId: string;
  readonly triggerText: string;
  readonly durationMs?: number;
  readonly packet: ServerPacket;
}

export interface PacketDomainEventMap {
  monsterDeath: PacketDomainMonsterDeathEvent;
  zone: PacketDomainZoneEvent;
  joinMap: PacketDomainJoinMapEvent;
  animationMessage: PacketDomainAnimationMessageEvent;
  auraAdded: PacketDomainAuraEvent;
  auraRemoved: PacketDomainAuraEvent;
  counterAttackStart: PacketDomainCounterAttackEvent;
  counterAttackEnd: PacketDomainCounterAttackEvent;
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
