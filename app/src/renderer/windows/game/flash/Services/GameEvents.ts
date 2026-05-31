import { ServiceMap } from "effect";
import type { Effect } from "effect";
import type { Aura } from "@vexed/game";
import type {
  ClientPacket,
  ExtensionPacket,
  ServerPacket,
} from "../PacketTypes";
import type { PacketListenerDisposer } from "./Packet";

export type GameEvent =
  | "packetFromClient"
  | "packetFromServer"
  | "extensionResponse"
  | "monsterDeath"
  | "questComplete"
  | "zone"
  | "joinMap"
  | "animationMessage"
  | "auraAdded"
  | "auraRemoved"
  | "afk"
  | "antiCounterStart"
  | "antiCounterEnd"
  | "loopTauntClientCastAttempt"
  | "loopTauntServerCastConfirmed"
  | "playerLocation";

export type GamePacketEvent =
  | "packetFromClient"
  | "packetFromServer"
  | "extensionResponse";

export type GameSemanticEvent = Exclude<
  GameEvent,
  GamePacketEvent | "loopTauntClientCastAttempt" | "loopTauntServerCastConfirmed"
>;

export interface GameMonsterDeathEvent {
  readonly monMapId: number;
  readonly packet: ExtensionPacket;
}

export interface GameQuestCompleteReward {
  readonly intGold?: number;
  readonly intExp?: number;
  readonly iCP?: number;
  readonly typ?: string;
  readonly intCoins?: number;
}

export interface GameQuestCompleteEvent {
  readonly QuestID: number;
  readonly bSuccess: number;
  readonly sName: string;
  readonly rewardObj: GameQuestCompleteReward;
  readonly packet: ExtensionPacket;
}

export interface GameZoneEvent {
  readonly zone: string;
  readonly map: string;
  readonly packet: ExtensionPacket;
}

export interface GameJoinMapEvent {
  readonly mapName?: string;
  readonly mapId?: number;
  readonly roomNumber?: number;
  readonly packet: ExtensionPacket;
}

export interface GameAnimationMessageEvent {
  readonly message: string;
  readonly monMapId?: number;
  readonly sourceMonMapId?: number;
  readonly targetMonMapId?: number;
  readonly packet: ServerPacket;
}

export interface GameAuraEvent {
  readonly auraName: string;
  readonly targetId: number;
  readonly targetName?: string;
  readonly targetType: "monster" | "player";
  readonly aura?: Aura;
  readonly packet: ServerPacket;
}

export interface GameAntiCounterEvent {
  readonly monMapId: number;
  readonly source: "message" | "aura";
  readonly triggerId: string;
  readonly triggerText: string;
  readonly durationMs?: number;
  readonly packet: ServerPacket;
}

export interface GameAfkEvent {
  readonly username: string;
  readonly afk: boolean;
  readonly packet: ExtensionPacket;
}

export interface GamePlayerLocationEvent {
  readonly username: string;
  readonly cell?: string;
  readonly pad?: string;
  readonly x?: number;
  readonly y?: number;
  readonly packet: ExtensionPacket;
}

export interface GameLoopTauntClientCastAttemptEvent {
  readonly itemId: number;
  readonly monMapId: number;
  readonly packet: ClientPacket;
}

export interface GameLoopTauntServerCastConfirmedEvent {
  readonly auraIcon: string;
  readonly auraName: string;
  readonly monMapId: number;
  readonly packet: ServerPacket;
}

export interface GameEventMap {
  packetFromClient: string;
  packetFromServer: string;
  extensionResponse: string;
  monsterDeath: GameMonsterDeathEvent;
  questComplete: GameQuestCompleteEvent;
  zone: GameZoneEvent;
  joinMap: GameJoinMapEvent;
  animationMessage: GameAnimationMessageEvent;
  auraAdded: GameAuraEvent;
  auraRemoved: GameAuraEvent;
  afk: GameAfkEvent;
  antiCounterStart: GameAntiCounterEvent;
  antiCounterEnd: GameAntiCounterEvent;
  loopTauntClientCastAttempt: GameLoopTauntClientCastAttemptEvent;
  loopTauntServerCastConfirmed: GameLoopTauntServerCastConfirmedEvent;
  playerLocation: GamePlayerLocationEvent;
}

export type GameEventHandler<E extends GameEvent = GameEvent> = (
  event: GameEventMap[E],
) => Effect.Effect<void, unknown>;

export interface GameEventsShape {
  readonly started: true;
  on<E extends GameEvent>(
    event: E,
    handler: GameEventHandler<E>,
  ): Effect.Effect<PacketListenerDisposer>;
  emit<E extends GameEvent>(
    event: E,
    payload: GameEventMap[E],
  ): Effect.Effect<void>;
}

export class GameEvents extends ServiceMap.Service<
  GameEvents,
  GameEventsShape
>()("flash/Services/GameEvents") {}
