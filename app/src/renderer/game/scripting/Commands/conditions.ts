import { Effect } from "effect";
import { ScriptCommandResult, type ScriptCommandHandler } from "../Types";
import {
  createAllCondition,
  createAnyCondition,
  createAnyPlayerMetricCondition,
  createBooleanStateCondition,
  createCellCondition,
  createFactionRankCondition,
  createInventoryContainsCondition,
  createItemStateCondition,
  createMapCondition,
  createMonsterMetricCondition,
  createMonsterPresenceCondition,
  createNotCondition,
  createPlayerAuraCondition,
  createPlayerCountCondition,
  createPlayerLocationCondition,
  createPlayerMetricCondition,
  createPlayerNamedMetricCondition,
  createPlayerNameCondition,
  createQuestStateCondition,
  createSelfNumberMetricCondition,
  createTargetHpCondition,
  defineScriptCommandDomain,
  evaluateScriptCondition,
  readScriptComparison,
  requireScriptArgumentNumber,
  requireScriptArgumentIdentifier,
  requireScriptArgumentPositiveInteger,
  requireScriptArgumentString,
  type ScriptCommandDsl,
  type ScriptComparisonOperatorInput,
  type ScriptCondition,
  type ScriptInstructionRecorder,
  type ScriptMonsterMetric,
  type ScriptPlayerMetric,
} from "./commandDsl";
import { normalizeItemIdentifier } from "./itemOperations";

// Public condition builders return these expression values. `boolean` is kept
// as a convenience so scripts can branch on already-computed custom booleans.
type ConditionInput = ScriptCondition | boolean;
type ScriptItemIdentifier = string | number;

type ConditionScriptCommandArguments = {
  if: [condition: ConditionInput];
  if_all: [...conditions: ConditionInput[]];
  if_any: [...conditions: ConditionInput[]];
  else: [];
  end_if: [];
  in_cell: [cell: string];
  not_in_cell: [cell: string];
  equipped: [item: string];
  not_equipped: [item: string];
  has_target: [];
  has_no_target: [];
  in_inventory: [item: string, quantity?: number];
  not_in_inventory: [item: string, quantity?: number];
  in_tempinventory: [item: string, quantity?: number];
  not_in_tempinventory: [item: string, quantity?: number];
  in_bank: [item: ScriptItemIdentifier, quantity?: number];
  not_in_bank: [item: ScriptItemIdentifier, quantity?: number];
  in_combat: [];
  not_in_combat: [];
  in_house: [item: string, quantity?: number];
  not_in_house: [item: string, quantity?: number];
  is_member: [];
  is_not_member: [];
  player_in_map: [player: string];
  player_in_cell: [player: string, cell: string];
  player_not_in_map: [player: string];
  player_not_in_cell: [player: string, cell: string];
  player_name_equals: [player: string];
  can_complete_quest: [questId: number];
  cannot_complete_quest: [questId: number];
  quest_in_progress: [questId: number];
  quest_not_in_progress: [questId: number];
  quest_is_available: [questId: number];
  quest_not_available: [questId: number];
  is_maxed: [item: string];
  is_not_maxed: [item: string];
  item_has_dropped: [item: string];
  item_has_not_dropped: [item: string];
  in_map: [map: string];
  not_in_map: [map: string];
  monster_in_room: [monster: string];
  monster_not_in_room: [monster: string];
  can_buy_item: [item: string];
};

type ConditionBuilderScriptDsl = {
  and(...conditions: ConditionInput[]): ScriptCondition;
  or(...conditions: ConditionInput[]): ScriptCondition;
  not(condition: ConditionInput): ScriptCondition;
  hp(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  mp(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  hp_percentage(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  mp_percentage(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  gold(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  level(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  faction_rank(
    faction: string,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  player_hp(
    player: string,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  player_hp_percentage(
    player: string,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  any_player_hp_percentage(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  player_count(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  cell_player_count(
    operator: ScriptComparisonOperatorInput,
    value: number,
    cell?: string,
  ): ScriptCondition;
  player_aura(
    player: string,
    aura: string,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  target_hp(
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  monster_hp(
    target: string,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
  monster_hp_percentage(
    target: string,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ): ScriptCondition;
};

type ConditionScriptDsl = ScriptCommandDsl<ConditionScriptCommandArguments> &
  ConditionBuilderScriptDsl;

const conditionCommandDomain =
  defineScriptCommandDomain<ConditionScriptCommandArguments>();

// Conditional command handlers all follow the same skip-next behavior for
// legacy single-condition commands. Structured condition blocks use the
// annotated jump indices populated by the script compiler.
//
// These handlers are the runtime bridge: by the time they run, the script has
// already been compiled into `ScriptInstruction`s. The handler pulls a recorded
// condition object out of `instruction.args` and asks `evaluateScriptCondition`
// to interpret it against current game state.
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

const conditionCommandHandlerMap = conditionCommandDomain.defineHandlers({
  if: ifCommand,
  if_all: ifAllCommand,
  if_any: ifAnyCommand,
  else: elseCommand,
  end_if: endIfCommand,
  in_cell: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "in_cell",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  not_in_cell: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "not_in_cell",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  equipped: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "equipped",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  not_equipped: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "not_equipped",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  has_target: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "has_target",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  has_no_target: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "has_no_target",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  in_inventory: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "in_inventory",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  not_in_inventory: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "not_in_inventory",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  in_tempinventory: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "in_tempinventory",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  not_in_tempinventory: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "not_in_tempinventory",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  in_bank: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "in_bank",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  not_in_bank: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "not_in_bank",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  in_combat: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "in_combat",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  not_in_combat: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "not_in_combat",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  in_house: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "in_house",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  not_in_house: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "not_in_house",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  is_member: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "is_member",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  is_not_member: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "is_not_member",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_in_map: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_in_map",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_in_cell: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_in_cell",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_not_in_map: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_not_in_map",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_not_in_cell: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_not_in_cell",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_name_equals: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_name_equals",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  can_complete_quest: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "can_complete_quest",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  cannot_complete_quest: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "cannot_complete_quest",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  quest_in_progress: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "quest_in_progress",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  quest_not_in_progress: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "quest_not_in_progress",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  quest_is_available: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "quest_is_available",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  quest_not_available: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "quest_not_available",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  is_maxed: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "is_maxed",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  is_not_maxed: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "is_not_maxed",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  item_has_dropped: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "item_has_dropped",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  item_has_not_dropped: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "item_has_not_dropped",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  in_map: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "in_map",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  not_in_map: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "not_in_map",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  monster_in_room: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "monster_in_room",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  monster_not_in_room: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "monster_not_in_room",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  can_buy_item: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "can_buy_item",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
});

export const conditionCommandHandlers = conditionCommandDomain.handlerEntries(
  conditionCommandHandlerMap,
);

const readCondition = (command: string, value: unknown): ConditionInput => {
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

// Most inventory-style predicates default to "at least one". Values are
// normalized once at DSL-build time so evaluators can compare directly.
const defaultQuantity = (command: string, value: unknown) =>
  value === undefined
    ? 1
    : Math.max(
        1,
        Math.floor(requireScriptArgumentNumber(command, "quantity", value)),
      );

// Condition methods used to be commands that emitted instructions directly.
// They now return expression objects; only `if`, `if_all`, and `if_any` record
// those expressions as executable instructions.
const emitCondition = <T extends ScriptCondition>(
  _name: keyof ConditionScriptCommandArguments & string,
  condition: T,
): T => condition;

/**
 * Creates the condition portion of the user-facing `cmd` object.
 *
 * There are two categories here:
 * - control-flow methods (`if`, `if_all`, `if_any`, `else`, `end_if`) record
 *   instructions into the compiled script.
 * - predicate/logical methods (`hp`, `in_map`, `and`, `not`, etc.) only build
 *   `ScriptCondition` expression objects that control-flow methods consume.
 *
 * For example, `cmd.hp("<", 1000)` returns a `PlayerMetric` condition object.
 * It does not read player HP and it does not record an instruction. Wrapping it
 * in `cmd.if(...)` records that object; later `ifCommand` evaluates it through
 * `evaluateScriptCondition`.
 */
export const createConditionScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): ConditionScriptDsl => {
  const recordConditionInstruction =
    conditionCommandDomain.createInstructionRecorder(recordInstruction);

  const readConditions = (command: string, values: ConditionInput[]) => {
    if (values.length === 0) {
      throw new Error(`cmd.${command}: at least one condition is required`);
    }

    return values.map((condition) => readCondition(command, condition));
  };

  const inventoryCondition = (
    command: keyof ConditionScriptCommandArguments & string,
    location: "bank" | "house" | "inventory" | "temp",
    item: ScriptItemIdentifier,
    quantity: number | undefined,
    expected: boolean,
  ) =>
    emitCondition(
      command,
      createInventoryContainsCondition(
        location,
        normalizeItemIdentifier(
          requireScriptArgumentIdentifier(command, "item", item),
        ),
        defaultQuantity(command, quantity),
        expected,
      ),
    );

  const positiveIntArg = (command: string, name: string, value: number) =>
    requireScriptArgumentPositiveInteger(command, name, value);

  // Numeric condition helpers share the same build path:
  // public operator/value input -> internal comparison token -> condition node.
  // The matching runtime path is in `evaluateScriptCondition` by condition tag.
  const metricCondition = (
    command: string,
    metric: ScriptPlayerMetric,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ) => {
    const comparison = readScriptComparison(command, operator, value);
    return createPlayerMetricCondition(
      metric,
      comparison.operator,
      comparison.value,
    );
  };

  const selfNumberMetricCondition = (
    command: string,
    metric: "gold" | "level",
    operator: ScriptComparisonOperatorInput,
    value: number,
  ) => {
    const comparison = readScriptComparison(command, operator, value);
    return createSelfNumberMetricCondition(
      metric,
      comparison.operator,
      comparison.value,
    );
  };

  const namedPlayerMetricCondition = (
    command: string,
    metric: "hp" | "hp_percent",
    player: string,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ) => {
    const comparison = readScriptComparison(command, operator, value);
    return createPlayerNamedMetricCondition(
      metric,
      requireScriptArgumentString(command, "player", player),
      comparison.operator,
      comparison.value,
    );
  };

  const monsterMetricCondition = (
    command: string,
    metric: ScriptMonsterMetric,
    target: string,
    operator: ScriptComparisonOperatorInput,
    value: number,
  ) => {
    const comparison = readScriptComparison(command, operator, value);
    return createMonsterMetricCondition(
      metric,
      requireScriptArgumentString(command, "target", target),
      comparison.operator,
      comparison.value,
    );
  };

  return {
    /**
     * Starts a conditional block from one complete condition expression.
     *
     * `if` controls whether the following commands run. It accepts a single
     * expression, which can be a simple condition or a nested expression built
     * with `and`, `or`, or `not`.
     *
     * @param condition - Complete condition expression to evaluate.
     * @example
     * cmd.if(cmd.not(cmd.in_combat()))
     */
    if(condition: ConditionInput) {
      recordConditionInstruction("if", readCondition("if", condition));
    },

    /**
     * Starts a conditional block that runs only when every expression matches.
     *
     * `if_all(a, b)` is control-flow shorthand for
     * `if(and(a, b))`. Use it when the whole block has a flat AND condition.
     * Use `and` inside `if` when you need to nest the AND with `or` or `not`.
     *
     * @param conditions - Complete condition expressions to combine with logical AND.
     * @example
     * cmd.if_all(cmd.in_map("battleon"), cmd.hp_percentage(">", 80))
     */
    if_all(...conditions: ConditionInput[]) {
      if (conditions.length === 0) {
        throw new Error("cmd.if_all: at least one condition is required");
      }

      recordConditionInstruction(
        "if_all",
        ...conditions.map((condition) => readCondition("if_all", condition)),
      );
    },

    /**
     * Starts a conditional block that runs when any expression matches.
     *
     * `if_any(a, b)` is control-flow shorthand for
     * `if(or(a, b))`. Use it when the whole block has a flat OR condition.
     * Use `or` inside `if` when you need to nest the OR with `and` or `not`.
     *
     * @param conditions - Complete condition expressions to combine with logical OR.
     * @example
     * cmd.if_any(cmd.in_inventory("Token"), cmd.in_bank("Token"))
     */
    if_any(...conditions: ConditionInput[]) {
      if (conditions.length === 0) {
        throw new Error("cmd.if_any: at least one condition is required");
      }

      recordConditionInstruction(
        "if_any",
        ...conditions.map((condition) => readCondition("if_any", condition)),
      );
    },

    /**
     * Switches to the false branch of an active conditional block.
     *
     * @example
     * cmd.if(cmd.in_combat())
     * cmd.log("fighting")
     * cmd.else()
     * cmd.log("idle")
     * cmd.end_if()
     */
    else() {
      recordConditionInstruction("else");
    },

    /**
     * Ends the current conditional block.
     */
    end_if() {
      recordConditionInstruction("end_if");
    },

    /**
     * Builds the inverse of a condition expression.
     *
     * `not` only creates an expression. It does not start a block by itself;
     * pass it to `if`, `if_all`, `if_any`, `and`, or `or`.
     *
     * @param condition - Complete condition expression to invert.
     * @example
     * cmd.if(cmd.not(cmd.in_inventory("Token")))
     */
    not(condition: ConditionInput) {
      return createNotCondition(readCondition("not", condition));
    },

    /**
     * Builds a self HP condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - HP value to compare against.
     * @example
     * cmd.if(cmd.hp("<", 1000))
     */
    hp(operator, value) {
      return metricCondition("hp", "hp", operator, value);
    },

    /**
     * Builds a self MP condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - MP value to compare against.
     * @example
     * cmd.if(cmd.mp(">=", 30))
     */
    mp(operator, value) {
      return metricCondition("mp", "mp", operator, value);
    },

    /**
     * Builds a self HP percentage condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - HP percentage to compare against.
     * @example
     * cmd.if(cmd.hp_percentage("<", 40))
     */
    hp_percentage(operator, value) {
      return metricCondition("hp_percentage", "hp_percent", operator, value);
    },

    /**
     * Builds a self MP percentage condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - MP percentage to compare against.
     * @example
     * cmd.if(cmd.mp_percentage(">=", 20))
     */
    mp_percentage(operator, value) {
      return metricCondition("mp_percentage", "mp_percent", operator, value);
    },

    /**
     * Builds a gold condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - Gold value to compare against.
     * @example
     * cmd.if(cmd.gold(">=", 1000000))
     */
    gold(operator, value) {
      return selfNumberMetricCondition("gold", "gold", operator, value);
    },

    /**
     * Builds a level condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - Level value to compare against.
     * @example
     * cmd.if(cmd.level("=", 100))
     */
    level(operator, value) {
      return selfNumberMetricCondition("level", "level", operator, value);
    },

    /**
     * Builds a faction rank condition expression.
     *
     * @param faction - Faction name.
     * @param operator - Comparison operator.
     * @param value - Rank value to compare against.
     * @example
     * cmd.if(cmd.faction_rank("Good", ">=", 10))
     */
    faction_rank(faction, operator, value) {
      const comparison = readScriptComparison("faction_rank", operator, value);
      return createFactionRankCondition(
        requireScriptArgumentString("faction_rank", "faction", faction),
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Builds a named player HP condition expression.
     *
     * @param player - Player name.
     * @param operator - Comparison operator.
     * @param value - HP value to compare against.
     * @example
     * cmd.if(cmd.player_hp("Artix", "<", 1000))
     */
    player_hp(player, operator, value) {
      return namedPlayerMetricCondition(
        "player_hp",
        "hp",
        player,
        operator,
        value,
      );
    },

    /**
     * Builds a named player HP percentage condition expression.
     *
     * @param player - Player name.
     * @param operator - Comparison operator.
     * @param value - HP percentage to compare against.
     * @example
     * cmd.if(cmd.player_hp_percentage("Artix", "<=", 40))
     */
    player_hp_percentage(player, operator, value) {
      return namedPlayerMetricCondition(
        "player_hp_percentage",
        "hp_percent",
        player,
        operator,
        value,
      );
    },

    /**
     * Builds an any-player HP percentage condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - HP percentage to compare against.
     * @example
     * cmd.if(cmd.any_player_hp_percentage("<", 25))
     */
    any_player_hp_percentage(operator, value) {
      const comparison = readScriptComparison(
        "any_player_hp_percentage",
        operator,
        value,
      );
      return createAnyPlayerMetricCondition(
        "hp_percent",
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Builds a room player count condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - Player count to compare against.
     * @example
     * cmd.if(cmd.player_count(">=", 3))
     */
    player_count(operator, value) {
      const comparison = readScriptComparison("player_count", operator, value);
      return createPlayerCountCondition(
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Builds a cell player count condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - Player count to compare against.
     * @param cell - Optional cell name. Defaults to the current cell.
     * @example
     * cmd.if(cmd.cell_player_count(">=", 2, "Enter"))
     */
    cell_player_count(operator, value, cell) {
      const comparison = readScriptComparison(
        "cell_player_count",
        operator,
        value,
      );
      return createPlayerCountCondition(
        comparison.operator,
        comparison.value,
        cell === undefined
          ? undefined
          : requireScriptArgumentString("cell_player_count", "cell", cell),
      );
    },

    /**
     * Builds a player aura value condition expression.
     *
     * @param player - Player name.
     * @param aura - Aura name.
     * @param operator - Comparison operator.
     * @param value - Aura value to compare against.
     * @example
     * cmd.if(cmd.player_aura("Artix", "Some Aura", ">=", 1))
     */
    player_aura(player, aura, operator, value) {
      const comparison = readScriptComparison("player_aura", operator, value);
      return createPlayerAuraCondition(
        requireScriptArgumentString("player_aura", "player", player),
        requireScriptArgumentString("player_aura", "aura", aura),
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Builds a current target HP condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - HP value to compare against.
     * @example
     * cmd.if(cmd.target_hp("<", 5000))
     */
    target_hp(operator, value) {
      const comparison = readScriptComparison("target_hp", operator, value);
      return createTargetHpCondition(comparison.operator, comparison.value);
    },

    /**
     * Builds a monster HP condition expression.
     *
     * @param target - Monster name or target token.
     * @param operator - Comparison operator.
     * @param value - HP value to compare against.
     * @example
     * cmd.if(cmd.monster_hp("Ultra Boss", "<=", 100000))
     */
    monster_hp(target, operator, value) {
      return monsterMetricCondition(
        "monster_hp",
        "monster_health",
        target,
        operator,
        value,
      );
    },

    /**
     * Builds a monster HP percentage condition expression.
     *
     * @param target - Monster name or target token.
     * @param operator - Comparison operator.
     * @param value - HP percentage to compare against.
     * @example
     * cmd.if(cmd.monster_hp_percentage("Ultra Boss", "<=", 25))
     */
    monster_hp_percentage(target, operator, value) {
      return monsterMetricCondition(
        "monster_hp_percentage",
        "monster_health_percent",
        target,
        operator,
        value,
      );
    },

    /**
     * Builds a logical AND condition expression.
     *
     * `and` only creates an expression. It does not start a block by itself;
     * pass the result to `if`, `not`, `or`, or another `and`. Use `if_all`
     * when the entire conditional block is a flat AND of several expressions.
     *
     * @param conditions - Complete condition expressions to combine with logical AND.
     * @example
     * cmd.if(cmd.and(cmd.in_map("battleon"), cmd.hp_percentage(">", 80)))
     */
    and(...conditions) {
      return createAllCondition(readConditions("and", conditions));
    },

    /**
     * Builds a logical OR condition expression.
     *
     * `or` only creates an expression. It does not start a block by itself;
     * pass the result to `if`, `not`, `and`, or another `or`. Use `if_any`
     * when the entire conditional block is a flat OR of several expressions.
     *
     * @param conditions - Complete condition expressions to combine with logical OR.
     * @example
     * cmd.if(cmd.or(cmd.in_inventory("Token"), cmd.in_bank("Token")))
     */
    or(...conditions) {
      return createAnyCondition(readConditions("or", conditions));
    },

    /**
     * Checks whether the player is in a cell.
     *
     * @param cell - Cell name.
     */
    in_cell(cell) {
      return emitCondition(
        "in_cell",
        createCellCondition(
          requireScriptArgumentString("in_cell", "cell", cell),
          true,
        ),
      );
    },

    /**
     * Checks whether the player is not in a cell.
     *
     * @param cell - Cell name.
     */
    not_in_cell(cell) {
      return emitCondition(
        "not_in_cell",
        createCellCondition(
          requireScriptArgumentString("not_in_cell", "cell", cell),
          false,
        ),
      );
    },

    /**
     * Checks whether an item is equipped.
     *
     * @param item - Item name.
     */
    equipped(item) {
      return emitCondition(
        "equipped",
        createItemStateCondition(
          requireScriptArgumentString("equipped", "item", item),
          "equipped",
          true,
        ),
      );
    },

    /**
     * Checks whether an item is not equipped.
     *
     * @param item - Item name.
     */
    not_equipped(item) {
      return emitCondition(
        "not_equipped",
        createItemStateCondition(
          requireScriptArgumentString("not_equipped", "item", item),
          "equipped",
          false,
        ),
      );
    },

    /**
     * Checks whether the player currently has a target.
     */
    has_target() {
      return emitCondition(
        "has_target",
        createBooleanStateCondition("has_target", true),
      );
    },

    /**
     * Checks whether the player currently has no target.
     */
    has_no_target() {
      return emitCondition(
        "has_no_target",
        createBooleanStateCondition("has_target", false),
      );
    },

    /**
     * Checks whether the inventory contains an item.
     *
     * @param item - Item name.
     * @param quantity - Quantity required. Defaults to `1`.
     */
    in_inventory(item, quantity) {
      return inventoryCondition(
        "in_inventory",
        "inventory",
        item,
        quantity,
        true,
      );
    },

    /**
     * Checks whether the inventory does not contain an item.
     *
     * @param item - Item name.
     * @param quantity - Quantity threshold. Defaults to `1`.
     */
    not_in_inventory(item, quantity) {
      return inventoryCondition(
        "not_in_inventory",
        "inventory",
        item,
        quantity,
        false,
      );
    },

    /**
     * Checks whether the temp inventory contains an item.
     *
     * @param item - Temporary item name.
     * @param quantity - Quantity required. Defaults to `1`.
     */
    in_tempinventory(item, quantity) {
      return inventoryCondition(
        "in_tempinventory",
        "temp",
        item,
        quantity,
        true,
      );
    },

    /**
     * Checks whether the temp inventory does not contain an item.
     *
     * @param item - Temporary item name.
     * @param quantity - Quantity threshold. Defaults to `1`.
     */
    not_in_tempinventory(item, quantity) {
      return inventoryCondition(
        "not_in_tempinventory",
        "temp",
        item,
        quantity,
        false,
      );
    },

    /**
     * Checks whether the bank contains an item.
     *
     * @param item - Item name or item id.
     * @param quantity - Quantity required. Defaults to `1`.
     */
    in_bank(item, quantity) {
      return inventoryCondition("in_bank", "bank", item, quantity, true);
    },

    /**
     * Checks whether the bank does not contain an item.
     *
     * @param item - Item name or item id.
     * @param quantity - Quantity threshold. Defaults to `1`.
     */
    not_in_bank(item, quantity) {
      return inventoryCondition("not_in_bank", "bank", item, quantity, false);
    },

    /**
     * Checks whether the player is in combat.
     */
    in_combat() {
      return emitCondition(
        "in_combat",
        createBooleanStateCondition("in_combat", true),
      );
    },

    /**
     * Checks whether the player is not in combat.
     */
    not_in_combat() {
      return emitCondition(
        "not_in_combat",
        createBooleanStateCondition("in_combat", false),
      );
    },

    /**
     * Checks whether the house inventory contains an item.
     *
     * @param item - Item name.
     * @param quantity - Quantity required. Defaults to `1`.
     */
    in_house(item, quantity) {
      return inventoryCondition("in_house", "house", item, quantity, true);
    },

    /**
     * Checks whether the house inventory does not contain an item.
     *
     * @param item - Item name.
     * @param quantity - Quantity threshold. Defaults to `1`.
     */
    not_in_house(item, quantity) {
      return inventoryCondition("not_in_house", "house", item, quantity, false);
    },

    /**
     * Checks whether the account is a member.
     */
    is_member() {
      return emitCondition(
        "is_member",
        createBooleanStateCondition("member", true),
      );
    },

    /**
     * Checks whether the account is not a member.
     */
    is_not_member() {
      return emitCondition(
        "is_not_member",
        createBooleanStateCondition("member", false),
      );
    },

    /**
     * Checks whether a player is in the current map.
     *
     * @param player - Player name.
     */
    player_in_map(player) {
      return emitCondition(
        "player_in_map",
        createPlayerLocationCondition(
          requireScriptArgumentString("player_in_map", "player", player),
          true,
        ),
      );
    },

    /**
     * Checks whether a player is in a cell.
     *
     * @param player - Player name.
     * @param cell - Cell name.
     */
    player_in_cell(player, cell) {
      return emitCondition(
        "player_in_cell",
        createPlayerLocationCondition(
          requireScriptArgumentString("player_in_cell", "player", player),
          true,
          requireScriptArgumentString("player_in_cell", "cell", cell),
        ),
      );
    },

    /**
     * Checks whether a player is not in the current map.
     *
     * @param player - Player name.
     */
    player_not_in_map(player) {
      return emitCondition(
        "player_not_in_map",
        createPlayerLocationCondition(
          requireScriptArgumentString("player_not_in_map", "player", player),
          false,
        ),
      );
    },

    /**
     * Checks whether a player is not in a cell.
     *
     * @param player - Player name.
     * @param cell - Cell name.
     */
    player_not_in_cell(player, cell) {
      return emitCondition(
        "player_not_in_cell",
        createPlayerLocationCondition(
          requireScriptArgumentString("player_not_in_cell", "player", player),
          false,
          requireScriptArgumentString("player_not_in_cell", "cell", cell),
        ),
      );
    },

    /**
     * Checks whether the current player name matches a value.
     *
     * @param player - Expected player name.
     */
    player_name_equals(player) {
      return emitCondition(
        "player_name_equals",
        createPlayerNameCondition(
          requireScriptArgumentString("player_name_equals", "player", player),
          true,
        ),
      );
    },

    /**
     * Checks whether a quest can be completed.
     *
     * @param questId - Quest id.
     */
    can_complete_quest(questId) {
      return emitCondition(
        "can_complete_quest",
        createQuestStateCondition(
          positiveIntArg("can_complete_quest", "questId", questId),
          "can_complete",
          true,
        ),
      );
    },

    /**
     * Checks whether a quest cannot be completed.
     *
     * @param questId - Quest id.
     */
    cannot_complete_quest(questId) {
      return emitCondition(
        "cannot_complete_quest",
        createQuestStateCondition(
          positiveIntArg("cannot_complete_quest", "questId", questId),
          "can_complete",
          false,
        ),
      );
    },

    /**
     * Checks whether a quest is in progress.
     *
     * @param questId - Quest id.
     */
    quest_in_progress(questId) {
      return emitCondition(
        "quest_in_progress",
        createQuestStateCondition(
          positiveIntArg("quest_in_progress", "questId", questId),
          "in_progress",
          true,
        ),
      );
    },

    /**
     * Checks whether a quest is not in progress.
     *
     * @param questId - Quest id.
     */
    quest_not_in_progress(questId) {
      return emitCondition(
        "quest_not_in_progress",
        createQuestStateCondition(
          positiveIntArg("quest_not_in_progress", "questId", questId),
          "in_progress",
          false,
        ),
      );
    },

    /**
     * Checks whether a quest is available.
     *
     * @param questId - Quest id.
     */
    quest_is_available(questId) {
      return emitCondition(
        "quest_is_available",
        createQuestStateCondition(
          positiveIntArg("quest_is_available", "questId", questId),
          "available",
          true,
        ),
      );
    },

    /**
     * Checks whether a quest is not available.
     *
     * @param questId - Quest id.
     */
    quest_not_available(questId) {
      return emitCondition(
        "quest_not_available",
        createQuestStateCondition(
          positiveIntArg("quest_not_available", "questId", questId),
          "available",
          false,
        ),
      );
    },

    /**
     * Checks whether an item is at its max stack quantity.
     *
     * @param item - Item name.
     */
    is_maxed(item) {
      return emitCondition(
        "is_maxed",
        createItemStateCondition(
          requireScriptArgumentString("is_maxed", "item", item),
          "maxed",
          true,
        ),
      );
    },

    /**
     * Checks whether an item is not at its max stack quantity.
     *
     * @param item - Item name.
     */
    is_not_maxed(item) {
      return emitCondition(
        "is_not_maxed",
        createItemStateCondition(
          requireScriptArgumentString("is_not_maxed", "item", item),
          "maxed",
          false,
        ),
      );
    },

    /**
     * Checks whether an item is present in the drop list.
     *
     * @param item - Item name.
     */
    item_has_dropped(item) {
      return emitCondition(
        "item_has_dropped",
        createItemStateCondition(
          requireScriptArgumentString("item_has_dropped", "item", item),
          "dropped",
          true,
        ),
      );
    },

    /**
     * Checks whether an item is absent from the drop list.
     *
     * @param item - Item name.
     */
    item_has_not_dropped(item) {
      return emitCondition(
        "item_has_not_dropped",
        createItemStateCondition(
          requireScriptArgumentString("item_has_not_dropped", "item", item),
          "dropped",
          false,
        ),
      );
    },

    /**
     * Checks whether the player is in a map.
     *
     * @param map - Map name.
     */
    in_map(map) {
      return emitCondition(
        "in_map",
        createMapCondition(
          requireScriptArgumentString("in_map", "map", map),
          true,
        ),
      );
    },

    /**
     * Checks whether the player is not in a map.
     *
     * @param map - Map name.
     */
    not_in_map(map) {
      return emitCondition(
        "not_in_map",
        createMapCondition(
          requireScriptArgumentString("not_in_map", "map", map),
          false,
        ),
      );
    },

    /**
     * Checks whether a monster is present in the room.
     *
     * @param monster - Monster name.
     */
    monster_in_room(monster) {
      return emitCondition(
        "monster_in_room",
        createMonsterPresenceCondition(
          requireScriptArgumentString("monster_in_room", "monster", monster),
          true,
        ),
      );
    },

    /**
     * Checks whether a monster is absent from the room.
     *
     * @param monster - Monster name.
     */
    monster_not_in_room(monster) {
      return emitCondition(
        "monster_not_in_room",
        createMonsterPresenceCondition(
          requireScriptArgumentString(
            "monster_not_in_room",
            "monster",
            monster,
          ),
          false,
        ),
      );
    },

    /**
     * Checks whether an item can be bought from the loaded shop.
     *
     * @param item - Item name.
     */
    can_buy_item(item) {
      return emitCondition(
        "can_buy_item",
        createItemStateCondition(
          requireScriptArgumentString("can_buy_item", "item", item),
          "can_buy",
          true,
        ),
      );
    },
  };
};
