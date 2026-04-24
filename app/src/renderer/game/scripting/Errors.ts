import { Data } from "effect";

export class ScriptCompileError extends Data.TaggedError("ScriptCompileError")<{
  readonly sourceName: string;
  readonly cause: unknown;
}> {}

export class ScriptDuplicateLabelError extends Data.TaggedError(
  "ScriptDuplicateLabelError",
)<{
  readonly sourceName: string;
  readonly label: string;
}> {}

export class ScriptInvalidControlFlowError extends Data.TaggedError(
  "ScriptInvalidControlFlowError",
)<{
  readonly sourceName: string;
  readonly instruction: string;
  readonly instructionIndex: number;
  readonly message: string;
}> {}

export class ScriptUnknownCommandError extends Data.TaggedError(
  "ScriptUnknownCommandError",
)<{
  readonly sourceName: string;
  readonly command: string;
  readonly instructionIndex: number;
}> {}

export class ScriptLabelNotFoundError extends Data.TaggedError(
  "ScriptLabelNotFoundError",
)<{
  readonly sourceName: string;
  readonly label: string;
}> {}

export class ScriptInvalidArgumentError extends Data.TaggedError(
  "ScriptInvalidArgumentError",
)<{
  readonly sourceName: string;
  readonly command: string;
  readonly message: string;
}> {}

export class ScriptNotReadyError extends Data.TaggedError("ScriptNotReadyError")<{
  readonly sourceName: string;
  readonly reason: string;
}> {}
