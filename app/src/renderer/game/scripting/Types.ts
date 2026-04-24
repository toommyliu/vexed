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
import type { QuestsShape } from "../flash/Services/Quests";
import type { WorldShape } from "../flash/Services/World";

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

export interface ScriptExecutionContext {
  readonly sourceName: string;
  readonly bridge: BridgeShape;
  readonly combat: CombatShape;
  readonly player: PlayerShape;
  readonly quests: QuestsShape;
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
  instruction: ScriptInstruction,
) => Effect.Effect<ScriptCommandResult, ScriptCommandError>;
