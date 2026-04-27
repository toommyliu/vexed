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
  requireScriptArgumentPositiveInteger,
  requireScriptArgumentString,
  type ScriptCommandDsl,
  type ScriptComparisonOperatorInput,
  type ScriptCondition,
  type ScriptInstructionRecorder,
} from "./commandDsl";

type ConditionInput = ScriptCondition | boolean;

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
  faction_rank_greater_than: [faction: string, rank: number];
  faction_rank_less_than: [faction: string, rank: number];
  gold_greater_than: [gold: number];
  gold_less_than: [gold: number];
  has_target: [];
  has_no_target: [];
  hp_greater_than: [hp: number];
  hp_less_than: [hp: number];
  hp_percentage_greater_than: [percentage: number];
  hp_percentage_less_than: [percentage: number];
  in_inventory: [item: string, quantity?: number];
  not_in_inventory: [item: string, quantity?: number];
  in_tempinventory: [item: string, quantity?: number];
  not_in_tempinventory: [item: string, quantity?: number];
  in_bank: [item: string, quantity?: number];
  not_in_bank: [item: string, quantity?: number];
  in_combat: [];
  not_in_combat: [];
  in_house: [item: string, quantity?: number];
  not_in_house: [item: string, quantity?: number];
  is_member: [];
  is_not_member: [];
  player_aura_greater_than: [player: string, aura: string, value: number];
  player_aura_less_than: [player: string, aura: string, value: number];
  player_hp_greater_than: [player: string, hp: number];
  player_hp_less_than: [player: string, hp: number];
  player_hp_percentage_greater_than: [player: string, percentage: number];
  player_hp_percentage_less_than: [player: string, percentage: number];
  any_player_hp_percentage_greater_than: [percentage: number];
  any_player_hp_percentage_less_than: [percentage: number];
  player_count_greater_than: [count: number];
  player_count_less_than: [count: number];
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
  target_hp_greater_than: [hp: number];
  target_hp_less_than: [hp: number];
  target_hp_between: [monster: string, min: number, max: number];
  is_maxed: [item: string];
  is_not_maxed: [item: string];
  cell_player_count_greater_than: [count: number, cell?: string];
  cell_player_count_less_than: [count: number, cell?: string];
  item_has_dropped: [item: string];
  item_has_not_dropped: [item: string];
  level_is: [level: number];
  level_greater_than: [level: number];
  level_less_than: [level: number];
  mp_greater_than: [mp: number];
  mp_less_than: [mp: number];
  in_map: [map: string];
  not_in_map: [map: string];
  monster_hp_greater_than: [monster: string, hp: number];
  monster_hp_less_than: [monster: string, hp: number];
  monster_in_room: [monster: string];
  monster_not_in_room: [monster: string];
  can_buy_item: [item: string];
};

type ConditionBuilderScriptDsl = {
  and(...conditions: ConditionInput[]): ScriptCondition;
  or(...conditions: ConditionInput[]): ScriptCondition;
  not(condition: ConditionInput): ScriptCondition;
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
  faction_rank_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "faction_rank_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  faction_rank_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "faction_rank_less_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  gold_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "gold_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  gold_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "gold_less_than",
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
  hp_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "hp_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  hp_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "hp_less_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  hp_percentage_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "hp_percentage_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  hp_percentage_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "hp_percentage_less_than",
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
  player_aura_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_aura_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_aura_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_aura_less_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_hp_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_hp_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_hp_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_hp_less_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_hp_percentage_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_hp_percentage_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_hp_percentage_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_hp_percentage_less_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  any_player_hp_percentage_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "any_player_hp_percentage_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  any_player_hp_percentage_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "any_player_hp_percentage_less_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_count_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_count_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  player_count_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "player_count_less_than",
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
  target_hp_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "target_hp_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  target_hp_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "target_hp_less_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  target_hp_between: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "target_hp_between",
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
  cell_player_count_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "cell_player_count_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  cell_player_count_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "cell_player_count_less_than",
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
  level_is: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "level_is",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  level_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "level_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  level_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "level_less_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  mp_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "mp_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  mp_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "mp_less_than",
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
  monster_hp_greater_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "monster_hp_greater_than",
        instruction.args[0],
      );
      return matched
        ? ScriptCommandResult.Continue
        : ScriptCommandResult.JumpToIndex(instruction.index + 2);
    }),
  monster_hp_less_than: (context, instruction) =>
    Effect.gen(function* () {
      const matched = yield* evaluateScriptCondition(
        context,
        "monster_hp_less_than",
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

const defaultQuantity = (command: string, value: unknown) =>
  value === undefined
    ? 1
    : Math.max(
        1,
        Math.floor(requireScriptArgumentNumber(command, "quantity", value)),
      );

const emitCondition = <T extends ScriptCondition>(
  _name: keyof ConditionScriptCommandArguments & string,
  condition: T,
): T => condition;

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
    item: string,
    quantity: number | undefined,
    expected: boolean,
  ) =>
    emitCondition(
      command,
      createInventoryContainsCondition(
        location,
        requireScriptArgumentString(command, "item", item),
        defaultQuantity(command, quantity),
        expected,
      ),
    );

  const numberArg = (command: string, name: string, value: number) =>
    requireScriptArgumentNumber(command, name, value);

  const positiveIntArg = (command: string, name: string, value: number) =>
    requireScriptArgumentPositiveInteger(command, name, value);

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
     * cmd.if_all(cmd.in_map("battleon"), cmd.hp_percent(">", 80))
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
      const comparison = readScriptComparison("hp", operator, value);
      return createPlayerMetricCondition(
        "hp",
        comparison.operator,
        comparison.value,
      );
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
      const comparison = readScriptComparison("mp", operator, value);
      return createPlayerMetricCondition(
        "mp",
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Builds a self HP percentage condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - HP percentage to compare against.
     * @example
     * cmd.if(cmd.hp_percent("<", 40))
     */
    hp_percent(operator, value) {
      const comparison = readScriptComparison("hp_percent", operator, value);
      return createPlayerMetricCondition(
        "hp_percent",
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Builds a self MP percentage condition expression.
     *
     * @param operator - Comparison operator.
     * @param value - MP percentage to compare against.
     * @example
     * cmd.if(cmd.mp_percent(">=", 20))
     */
    mp_percent(operator, value) {
      const comparison = readScriptComparison("mp_percent", operator, value);
      return createPlayerMetricCondition(
        "mp_percent",
        comparison.operator,
        comparison.value,
      );
    },

    /**
     * Builds a monster HP condition expression.
     *
     * @param target - Monster name or target token.
     * @param operator - Comparison operator.
     * @param value - HP value to compare against.
     * @example
     * cmd.if(cmd.monster_health("Ultra Boss", "<", 50000))
     */
    monster_health(target, operator, value) {
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
     * Builds a monster HP percentage condition expression.
     *
     * @param target - Monster name or target token.
     * @param operator - Comparison operator.
     * @param value - HP percentage to compare against.
     * @example
     * cmd.if(cmd.monster_health_percent("Ultra Boss", "<=", 25))
     */
    monster_health_percent(target, operator, value) {
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

    /**
     * Builds a logical AND condition expression.
     *
     * `and` only creates an expression. It does not start a block by itself;
     * pass the result to `if`, `not`, `or`, or another `and`. Use `if_all`
     * when the entire conditional block is a flat AND of several expressions.
     *
     * @param conditions - Complete condition expressions to combine with logical AND.
     * @example
     * cmd.if(cmd.and(cmd.in_map("battleon"), cmd.hp_percent(">", 80)))
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
     * Checks whether a faction rank is at least the provided rank.
     *
     * @param faction - Faction name.
     * @param rank - Rank threshold.
     */
    faction_rank_greater_than(faction, rank) {
      return emitCondition(
        "faction_rank_greater_than",
        createFactionRankCondition(
          requireScriptArgumentString(
            "faction_rank_greater_than",
            "faction",
            faction,
          ),
          "gte",
          numberArg("faction_rank_greater_than", "rank", rank),
        ),
      );
    },

    /**
     * Checks whether a faction rank is at most the provided rank.
     *
     * @param faction - Faction name.
     * @param rank - Rank threshold.
     */
    faction_rank_less_than(faction, rank) {
      return emitCondition(
        "faction_rank_less_than",
        createFactionRankCondition(
          requireScriptArgumentString(
            "faction_rank_less_than",
            "faction",
            faction,
          ),
          "lte",
          numberArg("faction_rank_less_than", "rank", rank),
        ),
      );
    },

    /**
     * Checks whether current gold is greater than a value.
     *
     * @param gold - Gold threshold.
     */
    gold_greater_than(gold) {
      return emitCondition(
        "gold_greater_than",
        createSelfNumberMetricCondition(
          "gold",
          "gt",
          numberArg("gold_greater_than", "gold", gold),
        ),
      );
    },

    /**
     * Checks whether current gold is less than a value.
     *
     * @param gold - Gold threshold.
     */
    gold_less_than(gold) {
      return emitCondition(
        "gold_less_than",
        createSelfNumberMetricCondition(
          "gold",
          "lt",
          numberArg("gold_less_than", "gold", gold),
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
     * Checks whether current HP is greater than a value.
     *
     * @param hp - HP threshold.
     */
    hp_greater_than(hp) {
      return emitCondition(
        "hp_greater_than",
        createPlayerMetricCondition(
          "hp",
          "gt",
          numberArg("hp_greater_than", "hp", hp),
        ),
      );
    },

    /**
     * Checks whether current HP is less than a value.
     *
     * @param hp - HP threshold.
     */
    hp_less_than(hp) {
      return emitCondition(
        "hp_less_than",
        createPlayerMetricCondition(
          "hp",
          "lt",
          numberArg("hp_less_than", "hp", hp),
        ),
      );
    },

    /**
     * Checks whether current HP percentage is greater than a value.
     *
     * @param percentage - HP percentage threshold.
     */
    hp_percentage_greater_than(percentage) {
      return emitCondition(
        "hp_percentage_greater_than",
        createPlayerMetricCondition(
          "hp_percent",
          "gt",
          numberArg("hp_percentage_greater_than", "percentage", percentage),
        ),
      );
    },

    /**
     * Checks whether current HP percentage is less than a value.
     *
     * @param percentage - HP percentage threshold.
     */
    hp_percentage_less_than(percentage) {
      return emitCondition(
        "hp_percentage_less_than",
        createPlayerMetricCondition(
          "hp_percent",
          "lt",
          numberArg("hp_percentage_less_than", "percentage", percentage),
        ),
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
     * @param item - Item name.
     * @param quantity - Quantity required. Defaults to `1`.
     */
    in_bank(item, quantity) {
      return inventoryCondition("in_bank", "bank", item, quantity, true);
    },

    /**
     * Checks whether the bank does not contain an item.
     *
     * @param item - Item name.
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
     * Checks whether a player aura value is greater than a threshold.
     *
     * @param player - Player name.
     * @param aura - Aura name.
     * @param value - Aura value threshold.
     */
    player_aura_greater_than(player, aura, value) {
      return emitCondition(
        "player_aura_greater_than",
        createPlayerAuraCondition(
          requireScriptArgumentString(
            "player_aura_greater_than",
            "player",
            player,
          ),
          requireScriptArgumentString("player_aura_greater_than", "aura", aura),
          "gt",
          numberArg("player_aura_greater_than", "value", value),
        ),
      );
    },

    /**
     * Checks whether a player aura value is less than a threshold.
     *
     * @param player - Player name.
     * @param aura - Aura name.
     * @param value - Aura value threshold.
     */
    player_aura_less_than(player, aura, value) {
      return emitCondition(
        "player_aura_less_than",
        createPlayerAuraCondition(
          requireScriptArgumentString(
            "player_aura_less_than",
            "player",
            player,
          ),
          requireScriptArgumentString("player_aura_less_than", "aura", aura),
          "lt",
          numberArg("player_aura_less_than", "value", value),
        ),
      );
    },

    /**
     * Checks whether a player's HP is greater than a value.
     *
     * @param player - Player name.
     * @param hp - HP threshold.
     */
    player_hp_greater_than(player, hp) {
      return emitCondition(
        "player_hp_greater_than",
        createPlayerNamedMetricCondition(
          "hp",
          requireScriptArgumentString(
            "player_hp_greater_than",
            "player",
            player,
          ),
          "gt",
          numberArg("player_hp_greater_than", "hp", hp),
        ),
      );
    },

    /**
     * Checks whether a player's HP is less than a value.
     *
     * @param player - Player name.
     * @param hp - HP threshold.
     */
    player_hp_less_than(player, hp) {
      return emitCondition(
        "player_hp_less_than",
        createPlayerNamedMetricCondition(
          "hp",
          requireScriptArgumentString("player_hp_less_than", "player", player),
          "lt",
          numberArg("player_hp_less_than", "hp", hp),
        ),
      );
    },

    /**
     * Checks whether a player's HP percentage is greater than a value.
     *
     * @param player - Player name.
     * @param percentage - HP percentage threshold.
     */
    player_hp_percentage_greater_than(player, percentage) {
      return emitCondition(
        "player_hp_percentage_greater_than",
        createPlayerNamedMetricCondition(
          "hp_percent",
          requireScriptArgumentString(
            "player_hp_percentage_greater_than",
            "player",
            player,
          ),
          "gt",
          numberArg(
            "player_hp_percentage_greater_than",
            "percentage",
            percentage,
          ),
        ),
      );
    },

    /**
     * Checks whether a player's HP percentage is less than a value.
     *
     * @param player - Player name.
     * @param percentage - HP percentage threshold.
     */
    player_hp_percentage_less_than(player, percentage) {
      return emitCondition(
        "player_hp_percentage_less_than",
        createPlayerNamedMetricCondition(
          "hp_percent",
          requireScriptArgumentString(
            "player_hp_percentage_less_than",
            "player",
            player,
          ),
          "lt",
          numberArg("player_hp_percentage_less_than", "percentage", percentage),
        ),
      );
    },

    /**
     * Checks whether any player has HP percentage greater than a value.
     *
     * @param percentage - HP percentage threshold.
     */
    any_player_hp_percentage_greater_than(percentage) {
      return emitCondition(
        "any_player_hp_percentage_greater_than",
        createAnyPlayerMetricCondition(
          "hp_percent",
          "gt",
          numberArg(
            "any_player_hp_percentage_greater_than",
            "percentage",
            percentage,
          ),
        ),
      );
    },

    /**
     * Checks whether any player has HP percentage less than a value.
     *
     * @param percentage - HP percentage threshold.
     */
    any_player_hp_percentage_less_than(percentage) {
      return emitCondition(
        "any_player_hp_percentage_less_than",
        createAnyPlayerMetricCondition(
          "hp_percent",
          "lt",
          numberArg(
            "any_player_hp_percentage_less_than",
            "percentage",
            percentage,
          ),
        ),
      );
    },

    /**
     * Checks whether the room player count is greater than a value.
     *
     * @param count - Player count threshold.
     */
    player_count_greater_than(count) {
      return emitCondition(
        "player_count_greater_than",
        createPlayerCountCondition(
          "gt",
          numberArg("player_count_greater_than", "count", count),
        ),
      );
    },

    /**
     * Checks whether the room player count is less than a value.
     *
     * @param count - Player count threshold.
     */
    player_count_less_than(count) {
      return emitCondition(
        "player_count_less_than",
        createPlayerCountCondition(
          "lt",
          numberArg("player_count_less_than", "count", count),
        ),
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
     * Checks whether the current target HP is greater than a value.
     *
     * @param hp - HP threshold.
     */
    target_hp_greater_than(hp) {
      return emitCondition(
        "target_hp_greater_than",
        createTargetHpCondition(
          "gt",
          numberArg("target_hp_greater_than", "hp", hp),
        ),
      );
    },

    /**
     * Checks whether the current target HP is less than a value.
     *
     * @param hp - HP threshold.
     */
    target_hp_less_than(hp) {
      return emitCondition(
        "target_hp_less_than",
        createTargetHpCondition(
          "lt",
          numberArg("target_hp_less_than", "hp", hp),
        ),
      );
    },

    /**
     * Checks whether the current target HP is between two values.
     *
     * @param _monster - Legacy monster argument; current target is used.
     * @param min - Lower HP bound.
     * @param max - Upper HP bound.
     */
    target_hp_between(_monster, min, max) {
      return emitCondition(
        "target_hp_between",
        createTargetHpCondition(
          "gt",
          numberArg("target_hp_between", "min", min),
          numberArg("target_hp_between", "max", max),
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
     * Checks whether a cell player count is greater than a value.
     *
     * @param count - Player count threshold.
     * @param cell - Optional cell name. Defaults to the current cell.
     */
    cell_player_count_greater_than(count, cell) {
      return emitCondition(
        "cell_player_count_greater_than",
        createPlayerCountCondition(
          "gt",
          numberArg("cell_player_count_greater_than", "count", count),
          cell === undefined
            ? undefined
            : requireScriptArgumentString(
                "cell_player_count_greater_than",
                "cell",
                cell,
              ),
        ),
      );
    },

    /**
     * Checks whether a cell player count is less than a value.
     *
     * @param count - Player count threshold.
     * @param cell - Optional cell name. Defaults to the current cell.
     */
    cell_player_count_less_than(count, cell) {
      return emitCondition(
        "cell_player_count_less_than",
        createPlayerCountCondition(
          "lt",
          numberArg("cell_player_count_less_than", "count", count),
          cell === undefined
            ? undefined
            : requireScriptArgumentString(
                "cell_player_count_less_than",
                "cell",
                cell,
              ),
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
     * Checks whether the player level equals a value.
     *
     * @param level - Level value.
     */
    level_is(level) {
      return emitCondition(
        "level_is",
        createSelfNumberMetricCondition(
          "level",
          "eq",
          numberArg("level_is", "level", level),
        ),
      );
    },

    /**
     * Checks whether the player level is greater than a value.
     *
     * @param level - Level threshold.
     */
    level_greater_than(level) {
      return emitCondition(
        "level_greater_than",
        createSelfNumberMetricCondition(
          "level",
          "gt",
          numberArg("level_greater_than", "level", level),
        ),
      );
    },

    /**
     * Checks whether the player level is less than a value.
     *
     * @param level - Level threshold.
     */
    level_less_than(level) {
      return emitCondition(
        "level_less_than",
        createSelfNumberMetricCondition(
          "level",
          "lt",
          numberArg("level_less_than", "level", level),
        ),
      );
    },

    /**
     * Checks whether current MP is greater than a value.
     *
     * @param mp - MP threshold.
     */
    mp_greater_than(mp) {
      return emitCondition(
        "mp_greater_than",
        createPlayerMetricCondition(
          "mp",
          "gt",
          numberArg("mp_greater_than", "mp", mp),
        ),
      );
    },

    /**
     * Checks whether current MP is less than a value.
     *
     * @param mp - MP threshold.
     */
    mp_less_than(mp) {
      return emitCondition(
        "mp_less_than",
        createPlayerMetricCondition(
          "mp",
          "lt",
          numberArg("mp_less_than", "mp", mp),
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
     * Checks whether a monster HP is greater than a value.
     *
     * @param monster - Monster name.
     * @param hp - HP threshold.
     */
    monster_hp_greater_than(monster, hp) {
      return emitCondition(
        "monster_hp_greater_than",
        createMonsterMetricCondition(
          "monster_health",
          requireScriptArgumentString(
            "monster_hp_greater_than",
            "monster",
            monster,
          ),
          "gt",
          numberArg("monster_hp_greater_than", "hp", hp),
        ),
      );
    },

    /**
     * Checks whether a monster HP is less than a value.
     *
     * @param monster - Monster name.
     * @param hp - HP threshold.
     */
    monster_hp_less_than(monster, hp) {
      return emitCondition(
        "monster_hp_less_than",
        createMonsterMetricCondition(
          "monster_health",
          requireScriptArgumentString(
            "monster_hp_less_than",
            "monster",
            monster,
          ),
          "lt",
          numberArg("monster_hp_less_than", "hp", hp),
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
