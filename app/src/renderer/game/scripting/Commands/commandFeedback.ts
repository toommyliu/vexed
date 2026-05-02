import { Effect } from "effect";
import { ScriptInvalidArgumentError } from "../Errors";
import type {
  ScriptDiagnosticInput,
  ScriptDiagnosticSeverity,
  ScriptExecutionContext,
} from "../Types";

type CommandFeedbackOptions = {
  readonly details?: Readonly<Record<string, unknown>>;
};

const notifyCommand = (
  context: ScriptExecutionContext,
  command: string,
  severity: ScriptDiagnosticSeverity,
  message: string,
  options?: CommandFeedbackOptions,
) =>
  context.notify({
    command,
    severity,
    message,
    ...(options?.details !== undefined ? { details: options.details } : null),
  } satisfies ScriptDiagnosticInput);

export const infoCommand = (
  context: ScriptExecutionContext,
  command: string,
  message: string,
  options?: CommandFeedbackOptions,
) => notifyCommand(context, command, "info", message, options);

export const warnCommand = (
  context: ScriptExecutionContext,
  command: string,
  message: string,
  options?: CommandFeedbackOptions,
) => notifyCommand(context, command, "warning", message, options);

export const failCommand = (
  context: ScriptExecutionContext,
  command: string,
  message: string,
  options?: CommandFeedbackOptions,
) =>
  Effect.gen(function* () {
    yield* notifyCommand(context, command, "error", message, options);
    return yield* new ScriptInvalidArgumentError({
      sourceName: context.sourceName,
      command,
      message,
    });
  });
