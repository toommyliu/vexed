import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  ScriptDuplicateLabelError,
  ScriptInvalidControlFlowError,
} from "./Errors";
import {
  compileScriptProgram,
  instructionCustomConditionNames,
} from "./scriptProgram";

describe("script program compiler", () => {
  it("compiles commands and annotates conditional control flow", async () => {
    const program = await Effect.runPromise(
      compileScriptProgram(
        `
cmd.if(cmd.hp("<", 1000))
cmd.rest()
cmd.else()
cmd.attack("*")
cmd.end_if()
        `,
        "compiler.test",
      ),
    );

    expect(program.instructions.map((instruction) => instruction.name)).toEqual([
      "if",
      "rest",
      "else",
      "attack",
      "end_if",
    ]);
    expect(program.instructions[0]?.controlFlow).toEqual({
      falseJumpIndex: 3,
    });
    expect(program.instructions[2]?.controlFlow).toEqual({
      endJumpIndex: 5,
    });
  });

  it("collects custom condition dependencies from nested condition args", async () => {
    const program = await Effect.runPromise(
      compileScriptProgram(
        `
cmd.register_condition("ready", () => true)
cmd.if(cmd.and(cmd.ready("x"), cmd.not(cmd.ready("y"))))
cmd.end_if()
        `,
        "compiler.test",
      ),
    );

    expect(instructionCustomConditionNames(program.instructions[1]!)).toEqual(
      new Set(["ready"]),
    );
  });

  it("fails duplicate labels and invalid control flow", async () => {
    await expect(
      Effect.runPromise(
        compileScriptProgram(
          `
cmd.label("loop")
cmd.label("loop")
          `,
          "compiler.test",
        ),
      ),
    ).rejects.toBeInstanceOf(ScriptDuplicateLabelError);

    await expect(
      Effect.runPromise(compileScriptProgram("cmd.else()", "compiler.test")),
    ).rejects.toBeInstanceOf(ScriptInvalidControlFlowError);
  });
});
