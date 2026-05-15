import type { Effect } from "effect";
import type { ScriptExecutionError, ScriptNotReadyError } from "./Errors";
import type { ArmyShape } from "../army/Services/Army";
import type { AuthShape } from "../flash/Services/Auth";
import type { AutoReloginShape } from "../features/Services/AutoRelogin";
import type { AutoZoneShape } from "../features/Services/AutoZone";
import type { BankShape } from "../flash/Services/Bank";
import type { CombatShape } from "../flash/Services/Combat";
import type { DropsShape } from "../flash/Services/Drops";
import type { HouseShape } from "../flash/Services/House";
import type { InventoryShape } from "../flash/Services/Inventory";
import type { JobsShape } from "../jobs/Services/Jobs";
import type { PacketShape } from "../flash/Services/Packet";
import type { PlayerShape } from "../flash/Services/Player";
import type { QuestsShape } from "../flash/Services/Quests";
import type { SettingsShape } from "../flash/Services/Settings";
import type { ShopsShape } from "../flash/Services/Shops";
import type { TempInventoryShape } from "../flash/Services/TempInventory";
import type { WorldShape } from "../flash/Services/World";

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

export interface ScriptContext {
  readonly api: ScriptApi;
  readonly autoRelogin: EffectValue<AutoReloginShape>;
  readonly autoZone: EffectValue<AutoZoneShape>;
}

export interface ScriptApi {
  readonly signal: AbortSignal;
  log(message: string): void;
  sleep(ms: number): Effect.Effect<void, ScriptExecutionError>;
  readonly army: EffectValue<ArmyShape>;
  readonly auth: EffectValue<AuthShape>;
  readonly bank: EffectValue<BankShape>;
  readonly combat: EffectValue<CombatShape>;
  readonly drops: EffectValue<DropsShape>;
  readonly house: EffectValue<HouseShape>;
  readonly inventory: EffectValue<InventoryShape>;
  readonly jobs: EffectValue<JobsShape>;
  readonly packet: ScriptPacketApi;
  readonly player: EffectValue<PlayerShape>;
  readonly quests: EffectValue<QuestsShape>;
  readonly settings: EffectValue<SettingsShape>;
  readonly shops: EffectValue<ShopsShape>;
  readonly tempInventory: EffectValue<TempInventoryShape>;
  readonly world: EffectValue<WorldShape>;
}

export type ScriptMain = (
  context: ScriptContext,
) => Generator<Effect.Yieldable<any, any, never, never>, unknown, never>;
