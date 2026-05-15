import { Effect } from "effect";
import {
  ScriptCompileError,
  ScriptDuplicateLabelError,
  ScriptInvalidControlFlowError,
} from "./Errors";
import { createScriptDsl } from "./Commands";
import {
  createCustomCondition,
  type ScriptCommandApi,
  type ScriptCondition,
} from "./Commands/commandDsl";
import type { ScriptInstruction, ScriptProgram } from "./Types";

type ConditionalBlockFrame = {
  readonly ifIndex: number;
  readonly elseIndex?: number;
};

const annotateControlFlow = (
  sourceName: string,
  instructions: ReadonlyArray<ScriptInstruction>,
): ReadonlyArray<ScriptInstruction> => {
  const annotated = [...instructions];
  const stack: Array<ConditionalBlockFrame> = [];

  const updateInstruction = (
    index: number,
    controlFlow: NonNullable<ScriptInstruction["controlFlow"]>,
  ) => {
    const instruction = annotated[index];
    if (!instruction) {
      return;
    }

    annotated[index] = {
      ...instruction,
      controlFlow: {
        ...instruction.controlFlow,
        ...controlFlow,
      },
    } satisfies ScriptInstruction;
  };

  for (const instruction of annotated) {
    switch (instruction.name) {
      case "if":
      case "if_all":
      case "if_any":
        stack.push({ ifIndex: instruction.index });
        break;
      case "else": {
        const frame = stack[stack.length - 1];
        if (!frame) {
          throw new ScriptInvalidControlFlowError({
            sourceName,
            instruction: instruction.name,
            instructionIndex: instruction.index,
            message: "cmd.else() must be paired with a previous cmd.if()",
          });
        }

        if (frame.elseIndex !== undefined) {
          throw new ScriptInvalidControlFlowError({
            sourceName,
            instruction: instruction.name,
            instructionIndex: instruction.index,
            message: "cmd.if() blocks can only contain one cmd.else()",
          });
        }

        stack[stack.length - 1] = {
          ...frame,
          elseIndex: instruction.index,
        };

        updateInstruction(frame.ifIndex, {
          falseJumpIndex: instruction.index + 1,
        });
        break;
      }
      case "end_if": {
        const frame = stack.pop();
        if (!frame) {
          throw new ScriptInvalidControlFlowError({
            sourceName,
            instruction: instruction.name,
            instructionIndex: instruction.index,
            message: "cmd.end_if() must be paired with a previous cmd.if()",
          });
        }

        const nextIndex = instruction.index + 1;
        if (frame.elseIndex === undefined) {
          updateInstruction(frame.ifIndex, {
            falseJumpIndex: nextIndex,
          });
        } else {
          updateInstruction(frame.elseIndex, {
            endJumpIndex: nextIndex,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  const dangling = stack.pop();
  if (dangling) {
    throw new ScriptInvalidControlFlowError({
      sourceName,
      instruction: "if",
      instructionIndex: dangling.ifIndex,
      message: "cmd.if() must be closed with cmd.end_if()",
    });
  }

  return annotated;
};

const collectCustomConditionNames = (
  value: unknown,
  names: Set<string>,
): void => {
  if (typeof value !== "object" || value === null) {
    return;
  }

  const condition = value as Partial<ScriptCondition>;
  switch (condition._tag) {
    case "Custom":
      if (typeof condition.name === "string" && condition.name.trim() !== "") {
        names.add(condition.name);
      }
      return;
    case "All":
    case "Any":
      if (Array.isArray(condition.conditions)) {
        for (const child of condition.conditions) {
          collectCustomConditionNames(child, names);
        }
      }
      return;
    case "Not":
      collectCustomConditionNames(condition.condition, names);
      return;
    default:
      return;
  }
};

export const instructionCustomConditionNames = (
  instruction: ScriptInstruction,
): ReadonlySet<string> => {
  const names = new Set<string>();
  for (const arg of instruction.args) {
    collectCustomConditionNames(arg, names);
  }
  return names;
};

export const compileScriptProgram = (
  source: string,
  sourceName: string,
): Effect.Effect<
  ScriptProgram,
  ScriptCompileError | ScriptDuplicateLabelError | ScriptInvalidControlFlowError
> =>
  Effect.try({
    try: () => {
      const instructions: Array<ScriptInstruction> = [];
      const recordInstruction = (
        name: string,
        args: ReadonlyArray<unknown>,
      ) => {
        instructions.push({
          name,
          args: [...args],
          index: instructions.length,
        });
      };
      const staticCmd = createScriptDsl(recordInstruction);
      const declaredCustomConditions = new Set<string>();
      const cmdProxy = new Proxy(staticCmd as Record<string, unknown>, {
        get(target, property, receiver) {
          if (property === "then") {
            return undefined;
          }

          if (typeof property !== "string") {
            return Reflect.get(target, property, receiver);
          }

          const value = Reflect.get(target, property, receiver);
          if (value !== undefined) {
            if (
              property === "register_condition" &&
              typeof value === "function"
            ) {
              return (...args: ReadonlyArray<unknown>) => {
                const result = Reflect.apply(value, target, args);
                const name = args[0];
                if (typeof name === "string") {
                  declaredCustomConditions.add(name.trim());
                }
                return result;
              };
            }

            return value;
          }

          if (declaredCustomConditions.has(property)) {
            return (...args: ReadonlyArray<unknown>) =>
              createCustomCondition(property, args);
          }

          return (...args: ReadonlyArray<unknown>) => {
            recordInstruction(property, args);
          };
        },
      });

      const evaluate = new Function("cmd", source) as (
        cmd: ScriptCommandApi,
      ) => void;
      evaluate(cmdProxy);

      const annotatedInstructions = annotateControlFlow(
        sourceName,
        instructions,
      );

      const labels = new Map<string, number>();
      for (const instruction of annotatedInstructions) {
        if (instruction.name !== "label") {
          continue;
        }

        const label = instruction.args[0];
        if (typeof label !== "string") {
          continue;
        }

        if (labels.has(label)) {
          throw new ScriptDuplicateLabelError({ sourceName, label });
        }

        labels.set(label, instruction.index + 1);
      }

      return {
        sourceName,
        instructions: annotatedInstructions,
        labels,
      } satisfies ScriptProgram;
    },
    catch: (cause) => {
      if (
        cause instanceof ScriptDuplicateLabelError ||
        cause instanceof ScriptInvalidControlFlowError
      ) {
        return cause;
      }

      return new ScriptCompileError({
        sourceName,
        cause,
      });
    },
  });
