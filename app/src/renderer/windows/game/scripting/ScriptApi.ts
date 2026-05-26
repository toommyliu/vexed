import type { Collection } from "@vexed/collection";
import type { Aura, Avatar, GameAction, Monster, Server } from "@vexed/game";
import type { Duration, Effect, Option } from "effect";
import type { ScriptOptions } from "../../../../shared/ipc";
import type { ScriptExecutionError, ScriptNotReadyError } from "./Errors";
import type { ScriptRecipesShape } from "./recipes";
import type { ArmyShape } from "../army/Services/Army";
import type { EnvironmentShape } from "../environment/Services/Environment";
import type { AuthConnectOutcome } from "../flash/Services/Auth";
import type { AutoZoneSupportedMap } from "../features/Services/AutoZone";
import type { BankShape } from "../flash/Services/Bank";
import type { BridgeEffect } from "../flash/Services/Bridge";
import type { CombatShape } from "../flash/Services/Combat";
import type { DropsShape } from "../flash/Services/Drops";
import type { HouseShape } from "../flash/Services/House";
import type { InventoryShape } from "../flash/Services/Inventory";
import type { OutfitsShape } from "../flash/Services/Outfits";
import type { PacketShape } from "../flash/Services/Packet";
import type { PlayerShape } from "../flash/Services/Player";
import type { QuestsShape } from "../flash/Services/Quests";
import type { ShopsShape } from "../flash/Services/Shops";
import type { TempInventoryShape } from "../flash/Services/TempInventory";

type EffectValue<T> =
  T extends Effect.Effect<infer A, infer E, infer R>
    ? Effect.Effect<A, E, R>
    : T extends (
          ...args: infer Args
        ) => Effect.Effect<infer A, infer E, infer R>
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

export interface ScriptAntiCounterEvent {
  readonly monMapId: number;
  readonly source: "message" | "aura";
  readonly triggerId: string;
  readonly triggerText: string;
  readonly durationMs?: number;
}

export type ScriptAntiCounterListener = (
  event: ScriptAntiCounterEvent,
) =>
  | void
  | Effect.Effect<unknown, unknown>
  | Generator<Effect.Yieldable<any, any, never, never>, unknown, never>;

export type ScriptAntiCounterDisposer = () => void;

export interface ScriptAuthShape {
  connectTo(server: string): BridgeEffect<AuthConnectOutcome>;
  getServers(): BridgeEffect<Server[]>;
  getUsername(): BridgeEffect<string>;
  getPassword(): BridgeEffect<string>;
  isLoggedIn(): BridgeEffect<boolean>;
  isTemporarilyKicked(): BridgeEffect<boolean>;
  login(username: string, password: string): BridgeEffect<void>;
  logout(): BridgeEffect<void>;
}

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

export type ScriptQuestsShape = Omit<QuestsShape, "onLoaded">;

export interface ScriptWaitOptions {
  readonly timeout?: Duration.Input;
  readonly interval?: Duration.Input;
}

export interface ScriptPlayerCountWaitOptions extends ScriptWaitOptions {
  readonly exact?: boolean;
}

export interface ScriptMonsterWaitOptions extends ScriptWaitOptions {
  readonly cell?: string;
  readonly currentCell?: boolean;
}

export interface ScriptItemWaitOptions extends ScriptWaitOptions {
  readonly quantity?: number;
}

export type ScriptWaitPredicate = () =>
  | boolean
  | Effect.Effect<boolean, unknown>
  | Generator<Effect.Yieldable<any, any, never, never>, boolean, never>;

export interface ScriptWaitShape {
  /**
   * Waits until a predicate returns true, or returns false when the optional timeout expires.
   *
   * ```js
   * const loaded = yield* api.wait.until(
   *   function* () {
   *     const map = yield* api.world.map.getName();
   *     return map === "battleon";
   *   },
   *   { timeout: "10 seconds", interval: "250 millis" },
   * );
   *
   * if (!loaded) {
   *   script.log("Battleon did not load in time.");
   * }
   * ```
   */
  until(
    predicate: ScriptWaitPredicate,
    options?: ScriptWaitOptions,
  ): Effect.Effect<boolean, unknown>;
  isGameActionAvailable(gameAction: GameAction): BridgeEffect<boolean>;
  forGameAction(
    gameAction: GameAction,
    options?: ScriptWaitOptions | Duration.Input,
  ): BridgeEffect<boolean>;
  forPlayerReady(options?: ScriptWaitOptions): BridgeEffect<boolean>;
  forPlayerPosition(
    x: number,
    y: number,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forCombatExit(options?: ScriptWaitOptions): Effect.Effect<boolean, unknown>;
  forFullyRested(options?: ScriptWaitOptions): BridgeEffect<boolean>;
  forMapLoaded(
    map?: string,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forLocation(
    location: { readonly cell?: string; readonly pad?: string },
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forPlayerCount(
    count: number,
    options?: ScriptPlayerCountWaitOptions,
  ): Effect.Effect<boolean, unknown>;
  forMonsterSpawn(
    monster: MonsterIdentifierToken,
    options?: ScriptMonsterWaitOptions,
  ): Effect.Effect<boolean, unknown>;
  forMonsterAvailable(
    monster: MonsterIdentifierToken,
    options?: ScriptMonsterWaitOptions,
  ): BridgeEffect<boolean>;
  forMonsterDeath(
    monster: MonsterIdentifierToken,
    options?: ScriptMonsterWaitOptions,
  ): Effect.Effect<boolean, unknown>;
  forDrop(
    item: ItemIdentifierToken,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forDropRemoved(
    item: ItemIdentifierToken,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forInventoryItem(
    item: ItemIdentifierToken,
    options?: ScriptItemWaitOptions,
  ): BridgeEffect<boolean>;
  forInventoryItemRemoved(
    item: ItemIdentifierToken,
    options?: ScriptItemWaitOptions,
  ): BridgeEffect<boolean>;
  forItemEquipped(
    item: ItemIdentifierToken,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forBankOpen(options?: ScriptWaitOptions): BridgeEffect<boolean>;
  forBankItem(
    item: ItemIdentifierToken,
    options?: ScriptItemWaitOptions,
  ): BridgeEffect<boolean>;
  forBankItemRemoved(
    item: ItemIdentifierToken,
    options?: ScriptItemWaitOptions,
  ): BridgeEffect<boolean>;
  forHouseItem(
    item: ItemIdentifierToken,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forQuestLoaded(
    questId: number,
    options?: ScriptWaitOptions,
  ): Effect.Effect<boolean, unknown>;
  forQuestAccepted(
    questId: number,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forQuestCompleted(
    questId: number,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
  forSkillReady(
    index: number | string,
    options?: ScriptWaitOptions,
  ): BridgeEffect<boolean>;
}

export interface ScriptWorldMapShape {
  getCellMonsters(): BridgeEffect<Monster[]>;
  getCells(): BridgeEffect<string[]>;
  getCellPads(): BridgeEffect<string[]>;
  isLoaded(): BridgeEffect<boolean>;
  getMapItem(itemId: number): BridgeEffect<void>;
  loadSwf(path: string): BridgeEffect<void>;
  reload(): BridgeEffect<void>;
  setSpawnPoint(cell?: string, pad?: string): BridgeEffect<void>;

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

export interface ScriptAntiCounterShape {
  isEnabled(): Effect.Effect<boolean>;
  setEnabled(enabled: boolean): Effect.Effect<void>;
  enable(): Effect.Effect<void>;
  disable(): Effect.Effect<void>;
  onStart(
    handler: ScriptAntiCounterListener,
  ): Effect.Effect<ScriptAntiCounterDisposer, ScriptNotReadyError>;
  onEnd(
    handler: ScriptAntiCounterListener,
  ): Effect.Effect<ScriptAntiCounterDisposer, ScriptNotReadyError>;
}

export type ScriptEnvironmentShape = Omit<
  EnvironmentShape,
  "setQuestAutoRegister" | "setItemRules"
>;

export interface ScriptContext {
  /**
   * Interact with the game.
   */
  readonly api: ScriptApi;
  /**
   * Manage the running script.
   */
  readonly script: ScriptRuntimeApi;
  /**
   * Use feature controls.
   */
  readonly features: ScriptFeaturesApi;
}

export interface ScriptFeaturesApi {
  /**
   * Controls automatic relogin behavior from scripts.
   */
  readonly autoRelogin: EffectValue<ScriptAutoReloginShape>;
  /**
   * Controls automatic boss zone movement from scripts.
   */
  readonly autoZone: EffectValue<ScriptAutoZoneShape>;
  /**
   * Controls anti counter-attack behavior from scripts.
   */
  readonly antiCounter: EffectValue<ScriptAntiCounterShape>;
}

export interface ScriptOptionsApi {
  getUsePrivateRooms(): Effect.Effect<boolean>;
  setUsePrivateRooms(
    enabled: boolean,
  ): Effect.Effect<void, ScriptExecutionError>;
  getAll(): Effect.Effect<Readonly<ScriptOptions>>;
  reset(): Effect.Effect<void>;
}

export interface ScriptRuntimeApi {
  /**
   * Current script cancellation signal; aborted when the script stops.
   */
  readonly signal: AbortSignal;
  readonly options: ScriptOptionsApi;
  log(message: string): void;
  /**
   * Stops the current script.
   */
  stop(reason?: string): Effect.Effect<never>;
  /**
   * Waits for milliseconds and cancels when the script stops. Prefer this over homemade `setTimeout` helpers to avoid background timers that keep running after the script is stopped.
   */
  sleep(ms: number): Effect.Effect<void, ScriptExecutionError>;
}

export interface ScriptApi {
  readonly army: EffectValue<ArmyShape>;
  readonly auth: EffectValue<ScriptAuthShape>;
  readonly bank: EffectValue<BankShape>;
  readonly combat: EffectValue<CombatShape>;
  readonly drops: EffectValue<DropsShape>;
  readonly environment: EffectValue<ScriptEnvironmentShape>;
  readonly house: EffectValue<HouseShape>;
  readonly inventory: EffectValue<InventoryShape>;
  readonly outfits: EffectValue<OutfitsShape>;
  readonly packet: ScriptPacketApi;
  readonly player: EffectValue<PlayerShape>;
  readonly quests: EffectValue<ScriptQuestsShape>;
  /**
   * High-level helpers for multi-step gameplay actions.
   */
  readonly recipes: EffectValue<ScriptRecipesShape>;
  readonly settings: EffectValue<ScriptSettingsShape>;
  readonly shops: EffectValue<ShopsShape>;
  readonly tempInventory: EffectValue<TempInventoryShape>;
  readonly wait: EffectValue<ScriptWaitShape>;
  readonly world: EffectValue<ScriptWorldShape>;
}

export type ScriptMain = (
  context: ScriptContext,
) => Generator<Effect.Yieldable<any, any, never, never>, unknown, never>;
