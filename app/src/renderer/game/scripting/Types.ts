import type { Effect } from "effect";
import type {
  ScriptCustomCommandError,
  ScriptCustomConditionError,
  ScriptInvalidArgumentError,
  ScriptLabelNotFoundError,
  ScriptNotReadyError,
} from "./Errors";
import type { BridgeError, BridgeShape } from "../flash/Services/Bridge";
import type { AuthShape } from "../flash/Services/Auth";
import type { AutoZoneShape } from "../flash/Services/AutoZone";
import type { BankShape } from "../flash/Services/Bank";
import type { CombatShape } from "../flash/Services/Combat";
import type { DropsShape } from "../flash/Services/Drops";
import type { HouseShape } from "../flash/Services/House";
import type { InventoryShape } from "../flash/Services/Inventory";
import type { JobsShape } from "../flash/Services/Jobs";
import type { PacketShape } from "../flash/Services/Packet";
import type { PacketDomainShape } from "../flash/Services/PacketDomain";
import type { PlayerShape } from "../flash/Services/Player";
import type { SettingsShape } from "../flash/Services/Settings";
import type { ShopsShape } from "../flash/Services/Shops";
import type { TempInventoryShape } from "../flash/Services/TempInventory";
import type { QuestsShape } from "../flash/Services/Quests";
import type { WorldShape } from "../flash/Services/World";
import type { ScriptEffect } from "./scriptEffect";
import type { ScriptRuntimeValue } from "./scriptRuntimeApi";

export interface ScriptInstructionControlFlow {
  readonly falseJumpIndex?: number;
  readonly endJumpIndex?: number;
}

export interface ScriptInstruction {
  readonly name: string;
  readonly args: ReadonlyArray<unknown>;
  readonly index: number;
  readonly controlFlow?: ScriptInstructionControlFlow;
}

export interface ScriptProgram {
  readonly sourceName: string;
  readonly instructions: ReadonlyArray<ScriptInstruction>;
  readonly labels: ReadonlyMap<string, number>;
}

export type ScriptCommandResult =
  | { readonly _tag: "Continue" }
  | { readonly _tag: "JumpToIndex"; readonly index: number }
  | { readonly _tag: "JumpToLabel"; readonly label: string }
  | { readonly _tag: "Stop" };

export const ScriptCommandResult = {
  Continue: { _tag: "Continue" } as const,
  JumpToIndex: (index: number) => ({ _tag: "JumpToIndex", index }) as const,
  JumpToLabel: (label: string) => ({ _tag: "JumpToLabel", label }) as const,
  Stop: { _tag: "Stop" } as const,
};

type CustomScriptRuntimeValue<T> =
  T extends Effect.Effect<infer A, unknown, unknown>
    ? Promise<A>
    : T extends (...args: infer Args) => infer Result
      ? (...args: Args) => CustomScriptRuntimeValue<Result>
      : T extends object
        ? { readonly [Key in keyof T]: CustomScriptRuntimeValue<T[Key]> }
        : T;

type CustomScriptEffectRuntimeValue<T> =
  T extends Effect.Effect<infer A, infer E, infer R>
    ? Effect.Effect<A, E, R>
    : T extends (...args: infer Args) => infer Result
      ? (...args: Args) => CustomScriptEffectRuntimeValue<Result>
      : T extends object
        ? { readonly [Key in keyof T]: CustomScriptEffectRuntimeValue<T[Key]> }
        : T;

type CustomScriptPacketApi = Pick<
  PacketShape,
  | "sendServer"
  | "sendClient"
  | "onExtensionResponse"
  | "packetFromServer"
  | "packetFromClient"
>;

export interface CustomScriptRuntimeApi {
  readonly auth: CustomScriptRuntimeValue<AuthShape>;
  readonly autoZone: CustomScriptRuntimeValue<AutoZoneShape>;
  readonly bank: CustomScriptRuntimeValue<BankShape>;
  readonly bridge: CustomScriptRuntimeValue<BridgeShape>;
  readonly combat: CustomScriptRuntimeValue<CombatShape>;
  readonly drops: CustomScriptRuntimeValue<DropsShape>;
  readonly house: CustomScriptRuntimeValue<HouseShape>;
  readonly inventory: CustomScriptRuntimeValue<InventoryShape>;
  readonly jobs: CustomScriptRuntimeValue<JobsShape>;
  readonly packet: CustomScriptRuntimeValue<CustomScriptPacketApi>;
  readonly player: CustomScriptRuntimeValue<PlayerShape>;
  readonly quests: CustomScriptRuntimeValue<QuestsShape>;
  readonly settings: CustomScriptRuntimeValue<SettingsShape>;
  readonly shops: CustomScriptRuntimeValue<ShopsShape>;
  readonly tempInventory: CustomScriptRuntimeValue<TempInventoryShape>;
  readonly world: CustomScriptRuntimeValue<WorldShape>;
}

export interface CustomScriptEffectRuntimeApi {
  readonly auth: CustomScriptEffectRuntimeValue<AuthShape>;
  readonly autoZone: CustomScriptEffectRuntimeValue<AutoZoneShape>;
  readonly bank: CustomScriptEffectRuntimeValue<BankShape>;
  readonly bridge: CustomScriptEffectRuntimeValue<BridgeShape>;
  readonly combat: CustomScriptEffectRuntimeValue<CombatShape>;
  readonly drops: CustomScriptEffectRuntimeValue<DropsShape>;
  readonly house: CustomScriptEffectRuntimeValue<HouseShape>;
  readonly inventory: CustomScriptEffectRuntimeValue<InventoryShape>;
  readonly jobs: CustomScriptEffectRuntimeValue<JobsShape>;
  readonly packet: CustomScriptEffectRuntimeValue<CustomScriptPacketApi>;
  readonly player: CustomScriptEffectRuntimeValue<PlayerShape>;
  readonly quests: CustomScriptEffectRuntimeValue<QuestsShape>;
  readonly settings: CustomScriptEffectRuntimeValue<SettingsShape>;
  readonly shops: CustomScriptEffectRuntimeValue<ShopsShape>;
  readonly tempInventory: CustomScriptEffectRuntimeValue<TempInventoryShape>;
  readonly world: CustomScriptEffectRuntimeValue<WorldShape>;
}

export type CustomCommandRuntimeApi = CustomScriptRuntimeApi;

export type CustomCommandResult =
  | { readonly _tag: "Continue" }
  | { readonly _tag: "SkipNext" }
  | { readonly _tag: "JumpToIndex"; readonly index: number }
  | { readonly _tag: "JumpToLabel"; readonly label: string }
  | { readonly _tag: "Stop" };

export interface CustomCommandContext {
  readonly args: ReadonlyArray<unknown>;
  readonly sourceName: string;
  readonly instruction: ScriptInstruction;
  readonly api: CustomScriptRuntimeApi;
  readonly Effect: ScriptEffect;
  readonly signal: AbortSignal;
  isCancelled(): boolean;
  continue(): CustomCommandResult;
  skipNext(): CustomCommandResult;
  gotoLabel(label: string): CustomCommandResult;
  jumpToIndex(index: number): CustomCommandResult;
  stop(): CustomCommandResult;
  log(message: string): void;
}

export interface CustomCommandEffectContext
  extends Omit<CustomCommandContext, "api"> {
  readonly api: CustomScriptEffectRuntimeApi;
}

type ScriptEffectGenerator<A> = Generator<
  Effect.Yieldable<any, any, any, never>,
  A,
  never
>;

export type CustomCommandHandler = (
  context: CustomCommandContext | CustomCommandEffectContext,
) =>
  | void
  | CustomCommandResult
  | Promise<void | CustomCommandResult>
  | ScriptEffectGenerator<void | CustomCommandResult>;

export interface CustomConditionContext {
  readonly args: ReadonlyArray<unknown>;
  readonly sourceName: string;
  readonly api: CustomScriptRuntimeApi;
  readonly Effect: ScriptEffect;
  readonly signal: AbortSignal;
  isCancelled(): boolean;
  log(message: string): void;
}

export interface CustomConditionEffectContext
  extends Omit<CustomConditionContext, "api"> {
  readonly api: CustomScriptEffectRuntimeApi;
}

export type CustomConditionHandler = (
  context: CustomConditionContext | CustomConditionEffectContext,
) => boolean | Promise<boolean> | ScriptEffectGenerator<boolean>;

export interface ScriptPacketHandlerContext {
  readonly sourceName: string;
  readonly api: CustomScriptRuntimeApi;
  readonly Effect: ScriptEffect;
  readonly signal: AbortSignal;
  isCancelled(): boolean;
  log(message: string): void;
}

export interface ScriptPacketHandlerEffectContext
  extends Omit<ScriptPacketHandlerContext, "api"> {
  readonly api: CustomScriptEffectRuntimeApi;
}

export type ScriptPacketHandler = (
  packet: unknown,
  context: ScriptPacketHandlerContext | ScriptPacketHandlerEffectContext,
) => void | Promise<void> | ScriptEffectGenerator<void>;

export interface ScriptExecutionContext {
  readonly sourceName: string;
  readonly auth: ScriptRuntimeValue<AuthShape>;
  readonly autoZone: ScriptRuntimeValue<AutoZoneShape>;
  readonly bank: ScriptRuntimeValue<BankShape>;
  readonly bridge: ScriptRuntimeValue<BridgeShape>;
  readonly combat: ScriptRuntimeValue<CombatShape>;
  readonly drops: ScriptRuntimeValue<DropsShape>;
  readonly house: ScriptRuntimeValue<HouseShape>;
  readonly inventory: ScriptRuntimeValue<InventoryShape>;
  readonly jobs: ScriptRuntimeValue<JobsShape>;
  readonly packet: ScriptRuntimeValue<PacketShape>;
  readonly packetDomain: ScriptRuntimeValue<PacketDomainShape>;
  readonly player: ScriptRuntimeValue<PlayerShape>;
  readonly quests: ScriptRuntimeValue<QuestsShape>;
  readonly settings: ScriptRuntimeValue<SettingsShape>;
  readonly shops: ScriptRuntimeValue<ShopsShape>;
  readonly tempInventory: ScriptRuntimeValue<TempInventoryShape>;
  readonly world: ScriptRuntimeValue<WorldShape>;
  readonly signal: AbortSignal;
  isCancelled(): boolean;
  run<A, E>(
    effect: Effect.Effect<A, E>,
  ): Effect.Effect<A, E | ScriptNotReadyError>;
  runApiEffect<A, E>(effect: Effect.Effect<A, E>): Promise<A>;
  setScriptCleanup(
    key: string,
    cleanup: Effect.Effect<void, unknown>,
  ): Effect.Effect<void>;
  removeScriptCleanup(key: string): Effect.Effect<void>;
  setCommandDelay(ms: number): Effect.Effect<void>;
  registerPacketHandler(
    type: "packetFromClient" | "packetFromServer" | "pext",
    name: string,
    handler: ScriptPacketHandler,
  ): Effect.Effect<void>;
  unregisterPacketHandler(
    type: "packetFromClient" | "packetFromServer" | "pext",
    name: string,
  ): Effect.Effect<void>;
  registerCustomCommand(
    name: string,
    handler: CustomCommandHandler,
  ): Effect.Effect<void, ScriptCommandError>;
  unregisterCustomCommand(
    name: string,
  ): Effect.Effect<void, ScriptCommandError>;
  registerCustomCondition(
    name: string,
    handler: CustomConditionHandler,
  ): Effect.Effect<void, ScriptCommandError>;
  unregisterCustomCondition(
    name: string,
  ): Effect.Effect<void, ScriptCommandError>;
  evaluateCustomCondition(
    name: string,
    args: ReadonlyArray<unknown>,
  ): Effect.Effect<boolean, ScriptCommandError>;
}

export type ScriptCommandError =
  | BridgeError
  | ScriptCustomCommandError
  | ScriptCustomConditionError
  | ScriptInvalidArgumentError
  | ScriptLabelNotFoundError
  | ScriptNotReadyError;

export type ScriptCommandHandler = (
  context: ScriptExecutionContext,
  instruction: ScriptInstruction,
) => Effect.Effect<ScriptCommandResult, ScriptCommandError>;
