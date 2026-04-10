import type { Effect } from "effect";
import type {
  ScriptInvalidArgumentError,
  ScriptLabelNotFoundError,
  ScriptNotReadyError,
} from "./Errors";
import type { BridgeError, BridgeShape } from "../flash/Services/Bridge";
import type { CombatShape } from "../flash/Services/Combat";
import type { PlayerShape } from "../flash/Services/Player";
import type { SettingsShape } from "../flash/Services/Settings";
import type { WorldShape } from "../flash/Services/World";

export interface ScriptInstruction {
  readonly name: string;
  readonly args: ReadonlyArray<unknown>;
  readonly index: number;
}

export interface ScriptProgram {
  readonly sourceName: string;
  readonly instructions: ReadonlyArray<ScriptInstruction>;
  readonly labels: ReadonlyMap<string, number>;
}

export type ScriptCommandResult =
  | { readonly _tag: "Continue" }
  | { readonly _tag: "JumpToLabel"; readonly label: string }
  | { readonly _tag: "Stop" };

export const ScriptCommandResult = {
  Continue: { _tag: "Continue" } as const,
  JumpToLabel: (label: string) => ({ _tag: "JumpToLabel", label }) as const,
  Stop: { _tag: "Stop" } as const,
};

export interface ScriptExecutionContext {
  readonly sourceName: string;
  readonly bridge: BridgeShape;
  readonly combat: CombatShape;
  readonly player: PlayerShape;
  readonly settings: SettingsShape;
  readonly world: WorldShape;
  run<A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E | ScriptNotReadyError>;
}

export type ScriptCommandError =
  | BridgeError
  | ScriptInvalidArgumentError
  | ScriptLabelNotFoundError
  | ScriptNotReadyError;

export type ScriptCommandHandler = (
  context: ScriptExecutionContext,
  args: ReadonlyArray<unknown>,
) => Effect.Effect<ScriptCommandResult, ScriptCommandError>;
