import type { Collection } from "@vexed/collection";
import type { Aura, Avatar, GameAction, Monster } from "@vexed/game";
import type { Duration, Effect, Option } from "effect";
import type { ScriptExecutionError, ScriptNotReadyError } from "./Errors";
import type { ArmyShape } from "../army/Services/Army";
import type { AuthShape } from "../flash/Services/Auth";
import type { AutoZoneSupportedMap } from "../features/Services/AutoZone";
import type { BankShape } from "../flash/Services/Bank";
import type { BridgeEffect } from "../flash/Services/Bridge";
import type { CombatShape } from "../flash/Services/Combat";
import type { DropsShape } from "../flash/Services/Drops";
import type { HouseShape } from "../flash/Services/House";
import type { InventoryShape } from "../flash/Services/Inventory";
import type { PacketShape } from "../flash/Services/Packet";
import type { PlayerShape } from "../flash/Services/Player";
import type { QuestsShape } from "../flash/Services/Quests";
import type { ShopsShape } from "../flash/Services/Shops";
import type { TempInventoryShape } from "../flash/Services/TempInventory";

type EffectValue<T> =
  T extends Effect.Effect<infer A, infer E, infer R>
    ? Effect.Effect<A, E, R>
    : T extends (...args: infer Args) => Effect.Effect<infer A, infer E, infer R>
      ? (...args: Args) => Effect.Effect<A, E, R>
      : T extends (...args: ReadonlyArray<never>) => unknown
        ? never
        : T extends object
          ? {
              readonly [Key in keyof T as EffectValue<T[Key]> extends never
                ? never
                : Key]: EffectValue<T[Key]>;
          }
          : never;

export type ScriptPacketListener = (
  packet: string,
) =>
  | void
  | Effect.Effect<unknown, unknown>
  | Generator<Effect.Yieldable<any, any, never, never>, unknown, never>;

export type ScriptPacketDisposer = () => void;

export interface ScriptPacketApi
  extends Pick<EffectValue<PacketShape>, "sendClient" | "sendServer"> {
  packetFromClient(
    handler: ScriptPacketListener,
  ): Effect.Effect<ScriptPacketDisposer, ScriptNotReadyError>;
  packetFromServer(
    handler: ScriptPacketListener,
  ): Effect.Effect<ScriptPacketDisposer, ScriptNotReadyError>;
  onExtensionResponse(
    handler: ScriptPacketListener,
  ): Effect.Effect<ScriptPacketDisposer, ScriptNotReadyError>;
}

export interface ScriptSettingsShape {
  setEnemyMagnet(enabled: boolean): BridgeEffect<void>;
  setInfiniteRange(enabled: boolean): BridgeEffect<void>;
  setProvokeCell(enabled: boolean): BridgeEffect<void>;
  setSkipCutscenes(enabled: boolean): BridgeEffect<void>;
  setCustomName(name: string): BridgeEffect<void>;
  setCustomGuild(name: string): BridgeEffect<void>;
  setWalkSpeed(speed: number): BridgeEffect<void>;
  setDeathAdsVisible(visible: boolean): BridgeEffect<void>;
  setCollisionsEnabled(enabled: boolean): BridgeEffect<void>;
  setEffectsEnabled(enabled: boolean): BridgeEffect<void>;
  setOtherPlayersVisible(visible: boolean): BridgeEffect<void>;
  setLagKillerEnabled(enabled: boolean): BridgeEffect<void>;
  setFrameRate(fps: number): BridgeEffect<void>;
}

export interface ScriptWorldMapShape {
  getCellMonsters(): BridgeEffect<Monster[]>;
  getCells(): BridgeEffect<string[]>;
  getCellPads(): BridgeEffect<string[]>;
  isLoaded(): BridgeEffect<boolean>;
  isActionAvailable(gameAction: GameAction): BridgeEffect<boolean>;
  getMapItem(itemId: number): BridgeEffect<void>;
  loadSwf(path: string): BridgeEffect<void>;
  reload(): BridgeEffect<void>;
  setSpawnPoint(cell?: string, pad?: string): BridgeEffect<void>;
  waitForGameAction(
    gameAction: GameAction,
    timeout?: Duration.Input,
  ): BridgeEffect<boolean>;

  getName(): Effect.Effect<string>;
  getId(): Effect.Effect<number>;
  getRoomNumber(): Effect.Effect<number>;
}

export interface ScriptWorldPlayersShape {
  readonly me: ScriptWorldMeShape;
  getAll(): Effect.Effect<Collection<string, Avatar>>;
  get(username: string): Effect.Effect<Option.Option<Avatar>>;
  getByName(name: string): Effect.Effect<Option.Option<Avatar>>;
  getAuras(username: string): Effect.Effect<readonly Aura[]>;
  getAura(
    username: string,
    auraName: string,
  ): Effect.Effect<Option.Option<Aura>>;
}

export interface ScriptWorldMeShape {
  get(): Effect.Effect<Option.Option<Avatar>>;
  getAuras(): Effect.Effect<readonly Aura[]>;
  getAura(auraName: string): Effect.Effect<Option.Option<Aura>>;
}

export interface ScriptWorldMonstersShape {
  getAll(): Effect.Effect<Collection<number, Monster>>;
  get(monMapId: number): Effect.Effect<Option.Option<Monster>>;
  findByName(
    name: string,
    cell?: string,
  ): Effect.Effect<Option.Option<Monster>>;
  getAura(
    monMapId: number,
    auraName: string,
  ): Effect.Effect<Option.Option<Aura>>;
}

export interface ScriptWorldShape {
  map: ScriptWorldMapShape;
  players: ScriptWorldPlayersShape;
  monsters: ScriptWorldMonstersShape;
}

export interface ScriptAutoReloginShape {
  isEnabled(): Effect.Effect<boolean>;
  enable(): Effect.Effect<void>;
  disable(): Effect.Effect<void>;
  getDelay(): Effect.Effect<number>;
  setDelay(delayMs: number): Effect.Effect<void>;
  getServer(): Effect.Effect<string | undefined>;
  setServer(serverName: string): Effect.Effect<void>;
}

export interface ScriptAutoZoneShape {
  isEnabled(): Effect.Effect<boolean>;
  getMap(): Effect.Effect<AutoZoneSupportedMap | undefined>;
  enable(): Effect.Effect<void>;
  disable(): Effect.Effect<void>;
  setMap(map: AutoZoneSupportedMap | undefined): Effect.Effect<void>;
}

export interface ScriptContext {
  readonly api: ScriptApi;
  readonly autoRelogin: EffectValue<ScriptAutoReloginShape>;
  readonly autoZone: EffectValue<ScriptAutoZoneShape>;
}

export interface ScriptApi {
  /**
   * Aborts when the script stops. Pass this to APIs that support cancellation.
   */
  readonly signal: AbortSignal;
  log(message: string): void;
  /**
   * Waits for milliseconds and cancels when the script stops.
   */
  sleep(ms: number): Effect.Effect<void, ScriptExecutionError>;
  readonly army: EffectValue<ArmyShape>;
  readonly auth: EffectValue<AuthShape>;
  readonly bank: EffectValue<BankShape>;
  readonly combat: EffectValue<CombatShape>;
  readonly drops: EffectValue<DropsShape>;
  readonly house: EffectValue<HouseShape>;
  readonly inventory: EffectValue<InventoryShape>;
  readonly packet: ScriptPacketApi;
  readonly player: EffectValue<PlayerShape>;
  readonly quests: EffectValue<QuestsShape>;
  readonly settings: EffectValue<ScriptSettingsShape>;
  readonly shops: EffectValue<ShopsShape>;
  readonly tempInventory: EffectValue<TempInventoryShape>;
  readonly world: EffectValue<ScriptWorldShape>;
}

export type ScriptMain = (
  context: ScriptContext,
) => Generator<Effect.Yieldable<any, any, never, never>, unknown, never>;
