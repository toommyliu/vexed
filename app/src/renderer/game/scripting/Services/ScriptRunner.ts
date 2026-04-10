import { ServiceMap } from "effect";
import type { Effect } from "effect";
import type { BridgeError } from "../../flash/Services/Bridge";
import type {
  ScriptCompileError,
  ScriptDuplicateLabelError,
  ScriptInvalidArgumentError,
  ScriptLabelNotFoundError,
  ScriptNotReadyError,
  ScriptUnknownCommandError,
} from "../Errors";
import type { ScriptCommandHandler } from "../Types";

export interface RunScriptOptions {
  readonly name?: string;
}

export interface RunningScriptCommand {
  readonly sourceName: string;
  readonly index: number;
  readonly name: string;
}

export type ScriptRunnerError =
  | BridgeError
  | ScriptCompileError
  | ScriptDuplicateLabelError
  | ScriptInvalidArgumentError
  | ScriptLabelNotFoundError
  | ScriptNotReadyError
  | ScriptUnknownCommandError;

export interface ScriptRunnerShape {
  run(source: string, options?: RunScriptOptions): Effect.Effect<void, ScriptRunnerError>;
  stop(reason?: string): Effect.Effect<void>;
  isRunning(): Effect.Effect<boolean>;
  currentCommand(): Effect.Effect<RunningScriptCommand | null>;
  listCommands(): Effect.Effect<ReadonlyArray<string>>;
  register(name: string, handler: ScriptCommandHandler): Effect.Effect<void>;
  unregister(name: string): Effect.Effect<void>;
}

export class ScriptRunner extends ServiceMap.Service<ScriptRunner, ScriptRunnerShape>()(
  "scripting/Services/ScriptRunner",
) {}
