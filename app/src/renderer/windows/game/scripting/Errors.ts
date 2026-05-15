import { Data } from "effect";

export class ScriptLoadError extends Data.TaggedError("ScriptLoadError")<{
  readonly sourceName: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ScriptExecutionError extends Data.TaggedError(
  "ScriptExecutionError",
)<{
  readonly sourceName: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ScriptNotReadyError extends Data.TaggedError(
  "ScriptNotReadyError",
)<{
  readonly sourceName: string;
  readonly reason: string;
}> {}
