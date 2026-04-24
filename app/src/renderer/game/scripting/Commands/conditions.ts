import { Effect } from "effect";
import { ScriptCommandResult, type ScriptCommandHandler } from "../Types";
import {
  createMonsterMetricCondition,
  createNotCondition,
  createPlayerMetricCondition,
  defineScriptCommandDomain,
  evaluateScriptCondition,
  requireScriptArgumentString,
  requireInstructionString,
  readScriptComparison,
  type ScriptCommandDsl,
  type ScriptComparisonOperatorInput,
  type ScriptCondition,
  type ScriptInstructionRecorder,
} from "./commandDsl";

type ConditionScriptCommandArguments = {
  if: [condition: ScriptCondition | boolean];
  if_all: [...conditions: Array<ScriptCondition | boolean>];
  if_any: [...conditions: Array<ScriptCondition | boolean>];
  else: [];
  end_if: [];
  label: [label: string];
  goto_label: [label: string];
};

type ConditionBuilderScriptDsl = {
  not(condition: ScriptCondition | boolean): ScriptCondition;
  hp(
    operator: ScriptComparisonOperatorInput | number,
    value: number | ScriptComparisonOperatorInput,
  ): ScriptCondition;
  mp(
    operator: ScriptComparisonOperatorInput | number,
    value: number | ScriptComparisonOperatorInput,
  ): ScriptCondition;
  hp_percent(
    operator: ScriptComparisonOperatorInput | number,
    value: number | ScriptComparisonOperatorInput,
  ): ScriptCondition;
  mp_percent(
    operator: ScriptComparisonOperatorInput | number,
    value: number | ScriptComparisonOperatorInput,
  ): ScriptCondition;
  monster_health(
    target: string,
    operator: ScriptComparisonOperatorInput | number,
    value: number | ScriptComparisonOperatorInput,
  ): ScriptCondition;
  monster_health_percent(
    target: string,
    operator: ScriptComparisonOperatorInput | number,
    value: number | ScriptComparisonOperatorInput,
  ): ScriptCondition;
};

type ConditionScriptDsl = ScriptCommandDsl<ConditionScriptCommandArguments> &
  ConditionBuilderScriptDsl;
const conditionCommandDomain =
  defineScriptCommandDomain<ConditionScriptCommandArguments>();

const jumpOnFalse = (
  instruction: Parameters<ScriptCommandHandler>[1],
):
  | typeof ScriptCommandResult.Continue
  | ReturnType<typeof ScriptCommandResult.JumpToIndex> => {
  const targetIndex = instruction.controlFlow?.falseJumpIndex;
  if (targetIndex === undefined) {
    return ScriptCommandResult.Continue;
  }

  return ScriptCommandResult.JumpToIndex(targetIndex);
};

const ifCommand: ScriptCommandHandler = (context, instruction) =>
  Effect.gen(function* () {
    const matched = yield* evaluateScriptCondition(
      context,
      "if",
      instruction.args[0],
    );
    return matched ? ScriptCommandResult.Continue : jumpOnFalse(instruction);
  });

const ifAllCommand: ScriptCommandHandler = (context, instruction) =>
  Effect.gen(function* () {
    for (const condition of instruction.args) {
      if (!(yield* evaluateScriptCondition(context, "if_all", condition))) {
        return jumpOnFalse(instruction);
      }
    }

    return ScriptCommandResult.Continue;
  });

const ifAnyCommand: ScriptCommandHandler = (context, instruction) =>
  Effect.gen(function* () {
    for (const condition of instruction.args) {
      if (yield* evaluateScriptCondition(context, "if_any", condition)) {
        return ScriptCommandResult.Continue;
      }
    }

    return jumpOnFalse(instruction);
  });

const elseCommand: ScriptCommandHandler = (_, instruction) =>
  Effect.succeed(
    instruction.controlFlow?.endJumpIndex === undefined
      ? ScriptCommandResult.Continue
      : ScriptCommandResult.JumpToIndex(instruction.controlFlow.endJumpIndex),
  );

const endIfCommand: ScriptCommandHandler = () =>
  Effect.succeed(ScriptCommandResult.Continue);

const labelCommand: ScriptCommandHandler = (context, instruction) =>
  Effect.gen(function* () {
    yield* requireInstructionString(
      context,
      "label",
      instruction.args,
      0,
      "label",
    );
    return ScriptCommandResult.Continue;
  });

const gotoLabelCommand: ScriptCommandHandler = (context, instruction) =>
  Effect.gen(function* () {
    const label = yield* requireInstructionString(
      context,
      "goto_label",
      instruction.args,
      0,
      "label",
    );
    return ScriptCommandResult.JumpToLabel(label);
  });

const conditionCommandHandlerMap = conditionCommandDomain.defineHandlers({
  if: ifCommand,
  if_all: ifAllCommand,
  if_any: ifAnyCommand,
  else: elseCommand,
  end_if: endIfCommand,
  label: labelCommand,
  goto_label: gotoLabelCommand,
});

export const conditionCommandHandlers = conditionCommandDomain.handlerEntries(
  conditionCommandHandlerMap,
);

const readCondition = (
  command: string,
  value: unknown,
): ScriptCondition | boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    throw new Error(
      `cmd.${command}: condition must be a valid condition expression`,
    );
  }

  return value as ScriptCondition;
};

export const createConditionScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): ConditionScriptDsl => {
  const recordConditionInstruction =
    conditionCommandDomain.createInstructionRecorder(recordInstruction);

  return {
    /**
     * Starts a conditional block.
     *
     * @param condition Condition to evaluate.
     * @example cmd.if(cmd.hp("below", 5))
     * cmd.log("low hp")
     * cmd.else()
     * cmd.log("hp is okay")
     * cmd.end_if()
     */
    if(condition: ScriptCondition | boolean) {
      recordConditionInstruction("if", readCondition("if", condition));
    },

    /**
     * Starts a conditional block that requires every condition to match.
     *
     * @param conditions One or more conditions to evaluate.
     * @example cmd.if_all(cmd.hp("below", 5), cmd.mp("below", 10))
     */
    if_all(...conditions: Array<ScriptCondition | boolean>) {
      if (conditions.length === 0) {
        throw new Error("cmd.if_all: at least one condition is required");
      }

      recordConditionInstruction(
        "if_all",
        ...conditions.map((condition) => readCondition("if_all", condition)),
      );
    },

    /**
     * Starts a conditional block that succeeds when any condition matches.
     *
     * @param conditions One or more conditions to evaluate.
     */
    if_any(...conditions: Array<ScriptCondition | boolean>) {
      if (conditions.length === 0) {
        throw new Error("cmd.if_any: at least one condition is required");
      }

      recordConditionInstruction(
        "if_any",
        ...conditions.map((condition) => readCondition("if_any", condition)),
      );
    },

    /**
     * Starts the fallback branch for the current conditional block.
     */
    else() {
      recordConditionInstruction("else");
    },

    /**
     * Closes the current conditional block.
     */
    end_if() {
      recordConditionInstruction("end_if");
    },

    /**
     * Declares a jump target label.
     *
     * @param label Label name.
     */
    label(label: string) {
      recordConditionInstruction(
        "label",
        requireScriptArgumentString("label", "label", label),
      );
    },

    /**
     * Jumps to a previously declared label.
     *
     * @param label Destination label.
     */
    goto_label(label: string) {
      recordConditionInstruction(
        "goto_label",
        requireScriptArgumentString("goto_label", "label", label),
      );
    },

    /**
     * Negates a condition.
     *
     * @param condition Condition to negate.
     */
    not(condition: ScriptCondition | boolean) {
      return createNotCondition(readCondition("not", condition));
    },

    /**
     * Checks the player's current HP.
     *
     * @param operator Comparison operator.
     * @param value Value to compare against.
     */
    hp(
      operator: ScriptComparisonOperatorInput | number,
      value: number | ScriptComparisonOperatorInput,
    ) {
      const comparison = readScriptComparison("hp", operator, value);
      return createPlayerMetricCondition(
        "hp",
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Checks the player's current MP.
     *
     * @param operator Comparison operator.
     * @param value Value to compare against.
     */
    mp(
      operator: ScriptComparisonOperatorInput | number,
      value: number | ScriptComparisonOperatorInput,
    ) {
      const comparison = readScriptComparison("mp", operator, value);
      return createPlayerMetricCondition(
        "mp",
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Checks the player's current HP percentage.
     *
     * @param operator Comparison operator.
     * @param value Value to compare against.
     */
    hp_percent(
      operator: ScriptComparisonOperatorInput | number,
      value: number | ScriptComparisonOperatorInput,
    ) {
      const comparison = readScriptComparison("hp_percent", operator, value);
      return createPlayerMetricCondition(
        "hp_percent",
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Checks the player's current MP percentage.
     *
     * @param operator Comparison operator.
     * @param value Value to compare against.
     */
    mp_percent(
      operator: ScriptComparisonOperatorInput | number,
      value: number | ScriptComparisonOperatorInput,
    ) {
      const comparison = readScriptComparison("mp_percent", operator, value);
      return createPlayerMetricCondition(
        "mp_percent",
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Checks a monster's current health.
     *
     * @param target Monster name or target token.
     * @param operator Comparison operator.
     * @param value Value to compare against.
     * @example cmd.if(cmd.monster_health("Boss", "below", 200))
     */
    monster_health(
      target: string,
      operator: ScriptComparisonOperatorInput | number,
      value: number | ScriptComparisonOperatorInput,
    ) {
      const comparison = readScriptComparison(
        "monster_health",
        operator,
        value,
      );
      return createMonsterMetricCondition(
        "monster_health",
        requireScriptArgumentString("monster_health", "target", target),
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Checks a monster's current health percentage.
     *
     * @param target Monster name or target token.
     * @param operator Comparison operator.
     * @param value Value to compare against.
     */
    monster_health_percent(
      target: string,
      operator: ScriptComparisonOperatorInput | number,
      value: number | ScriptComparisonOperatorInput,
    ) {
      const comparison = readScriptComparison(
        "monster_health_percent",
        operator,
        value,
      );
      return createMonsterMetricCondition(
        "monster_health_percent",
        requireScriptArgumentString("monster_health_percent", "target", target),
        comparison.operator,
        comparison.value,
      );
    },
  };
};
