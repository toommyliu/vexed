import { ServiceMap } from "effect";
import type { Effect } from "effect";
import type { BridgeError } from "../../flash/Services/Bridge";
import type {
  ScriptExecutionError,
  ScriptLoadError,
  ScriptNotReadyError,
} from "../Errors";
import type { ScriptDiagnostic } from "../Types";

export interface RunScriptOptions {
  readonly name?: string;
}

export type ScriptRunnerError =
  | BridgeError
  | ScriptExecutionError
  | ScriptLoadError
  | ScriptNotReadyError;

export interface ScriptRunnerShape {
  run(
    source: string,
    options?: RunScriptOptions,
  ): Effect.Effect<void, ScriptRunnerError>;
  stop(reason?: string): Effect.Effect<void>;
  isRunning(): Effect.Effect<boolean>;
  diagnostics(): Effect.Effect<ReadonlyArray<ScriptDiagnostic>>;
}

export class ScriptRunner extends ServiceMap.Service<
  ScriptRunner,
  ScriptRunnerShape
>()("scripting/Services/ScriptRunner") {}
