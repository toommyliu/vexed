import { Effect } from "effect";
import { expect, test } from "vitest";
import { ScriptInvalidArgumentError } from "./Errors";
import { makeScriptFeedback, withInstructionFeedback } from "./scriptFeedback";
import type {
  ScriptDiagnosticInput,
  ScriptExecutionContext,
  ScriptInstruction,
} from "./Types";

const createFeedbackContext = () => {
  const diagnostics: ScriptDiagnosticInput[] = [];
  const context = {
    sourceName: "scriptFeedback.test.ts",
    notify: (diagnostic: ScriptDiagnosticInput) =>
      Effect.sync(() => {
        diagnostics.push(diagnostic);
      }),
  } as unknown as ScriptExecutionContext;

  return {
    context,
    diagnostics,
  };
};

test("warn emits a non-fatal warning diagnostic with bound source", async () => {
  const fixture = createFeedbackContext();
  const feedback = makeScriptFeedback(fixture.context, {
    command: "test_command",
    instructionIndex: 2,
  });

  await Effect.runPromise(feedback.warn("soft problem"));

  expect(fixture.diagnostics).toEqual([
    {
      command: "test_command",
      instructionIndex: 2,
      severity: "warning",
      message: "soft problem",
    },
  ]);
});

test("fail emits an error diagnostic and fails with bound command", async () => {
  const fixture = createFeedbackContext();
  const feedback = makeScriptFeedback(fixture.context, {
    command: "test_command",
    instructionIndex: 3,
  });

  await expect(
    Effect.runPromise(feedback.fail("hard problem")),
  ).rejects.toEqual(
    expect.objectContaining({
      _tag: "ScriptInvalidArgumentError",
      command: "test_command",
      message: "hard problem",
    }),
  );

  expect(fixture.diagnostics).toEqual([
    {
      command: "test_command",
      instructionIndex: 3,
      severity: "error",
      message: "hard problem",
    },
  ]);
});

test("withInstructionFeedback binds diagnostics to the actual instruction", async () => {
  const fixture = createFeedbackContext();
  const instruction = {
    name: "alias_command",
    args: [],
    index: 7,
  } satisfies ScriptInstruction;
  const context = withInstructionFeedback(fixture.context, instruction);

  await expect(
    Effect.runPromise(context.feedback.fail("bad input")),
  ).rejects.toBeInstanceOf(ScriptInvalidArgumentError);

  expect(fixture.diagnostics).toEqual([
    {
      command: "alias_command",
      instructionIndex: 7,
      severity: "error",
      message: "bad input",
    },
  ]);
});
