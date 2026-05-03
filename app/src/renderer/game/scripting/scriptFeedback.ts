import { Effect } from "effect";
import { ScriptInvalidArgumentError } from "./Errors";
import type {
  ScriptDiagnosticInput,
  ScriptDiagnosticSeverity,
  ScriptExecutionContext,
  ScriptFeedback,
  ScriptFeedbackOptions,
  ScriptInstruction,
} from "./Types";

type ScriptFeedbackContext = {
  readonly sourceName: string;
  notify(diagnostic: ScriptDiagnosticInput): Effect.Effect<void>;
};

type ScriptFeedbackSource = {
  readonly command?: string;
  readonly instructionIndex?: number;
};

const notifyFeedback = (
  context: ScriptFeedbackContext,
  source: ScriptFeedbackSource,
  severity: ScriptDiagnosticSeverity,
  message: string,
  options?: ScriptFeedbackOptions,
) =>
  context.notify({
    ...(source.command !== undefined ? { command: source.command } : null),
    ...(source.instructionIndex !== undefined
      ? { instructionIndex: source.instructionIndex }
      : null),
    severity,
    message,
    ...(options?.details !== undefined ? { details: options.details } : null),
  } satisfies ScriptDiagnosticInput);

export const makeScriptFeedback = (
  context: ScriptFeedbackContext,
  source: ScriptFeedbackSource = {},
): ScriptFeedback => ({
  info: (message, options) =>
    notifyFeedback(context, source, "info", message, options),
  warn: (message, options) =>
    notifyFeedback(context, source, "warning", message, options),
  fail: (message, options) =>
    Effect.gen(function* () {
      yield* notifyFeedback(context, source, "error", message, options);
      return yield* new ScriptInvalidArgumentError({
        sourceName: context.sourceName,
        command: source.command ?? "script",
        message,
      });
    }),
});

export const withInstructionFeedback = <Context extends ScriptExecutionContext>(
  context: Context,
  instruction: ScriptInstruction,
): Context => ({
  ...context,
  feedback: makeScriptFeedback(context, {
    command: instruction.name,
    instructionIndex: instruction.index,
  }),
});
