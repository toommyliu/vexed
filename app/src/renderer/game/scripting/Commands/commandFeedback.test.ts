import { Effect } from "effect";
import { expect, test } from "vitest";
import { ScriptInvalidArgumentError } from "../Errors";
import type { ScriptDiagnosticInput, ScriptExecutionContext } from "../Types";
import { failCommand, warnCommand } from "./commandFeedback";

const createFeedbackContext = () => {
  const diagnostics: ScriptDiagnosticInput[] = [];
  const context = {
    sourceName: "commandFeedback.test.ts",
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

test("warnCommand emits a non-fatal warning diagnostic", async () => {
  const fixture = createFeedbackContext();

  await Effect.runPromise(
    warnCommand(fixture.context, "test_command", "soft problem"),
  );

  expect(fixture.diagnostics).toEqual([
    {
      command: "test_command",
      severity: "warning",
      message: "soft problem",
    },
  ]);
});

test("failCommand emits an error diagnostic and fails the command", async () => {
  const fixture = createFeedbackContext();

  await expect(
    Effect.runPromise(
      failCommand(fixture.context, "test_command", "hard problem"),
    ),
  ).rejects.toBeInstanceOf(ScriptInvalidArgumentError);

  expect(fixture.diagnostics).toEqual([
    {
      command: "test_command",
      severity: "error",
      message: "hard problem",
    },
  ]);
});
