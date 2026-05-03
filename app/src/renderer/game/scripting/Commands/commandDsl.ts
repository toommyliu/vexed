import { EntityState } from "@vexed/game";
import { positiveInt } from "@vexed/shared/number";
import { equalsIgnoreCase } from "@vexed/shared/string";
import { Effect, Option } from "effect";
import { ScriptInvalidArgumentError } from "../Errors";
import {
  ScriptCommandResult,
  type ScriptCommandError,
  type ScriptCommandHandler,
  type ScriptExecutionContext,
  type ScriptInstruction,
} from "../Types";
import { withInstructionFeedback } from "../scriptFeedback";

// Command domain types

export type ScriptCommandApi = Record<string, unknown>;
export type ScriptInstructionRecorder = (
  name: string,
  args: ReadonlyArray<unknown>,
) => void;
export type ScriptCommandArgumentMap<Commands> = {
  readonly [Command in keyof Commands]: ReadonlyArray<unknown>;
};
export type ScriptCommandName<
  Commands extends ScriptCommandArgumentMap<Commands>,
> = keyof Commands & string;
export type ScriptCommandHandlerMap<
  Commands extends ScriptCommandArgumentMap<Commands>,
> = {
  readonly [Command in ScriptCommandName<Commands>]: ScriptCommandHandler;
};
export type ScriptCommandDsl<
  Commands extends ScriptCommandArgumentMap<Commands>,
> = {
  readonly [Command in ScriptCommandName<Commands>]: (
    ...args: Commands[Command]
  ) => void;
};
export type ScriptCommandAliasMap<
  Commands extends ScriptCommandArgumentMap<Commands>,
> = Record<string, ScriptCommandName<Commands>>;
export type ScriptCommandDslWithAliases<
  Commands extends ScriptCommandArgumentMap<Commands>,
  Aliases extends ScriptCommandAliasMap<Commands>,
> = ScriptCommandDsl<Commands> & {
  readonly [Alias in keyof Aliases]: ScriptCommandDsl<Commands>[Aliases[Alias]];
};

// Conditions

export type ScriptComparisonOperator =
  | "eq" // ==
  | "ne" // !=
  | "lt" // <
  | "lte" // <=
  | "gt" // >
  | "gte"; // >=

export type ScriptComparisonOperatorInput =
  | "="
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">=";

export type ScriptPlayerMetric = "hp" | "hp_percent" | "mp" | "mp_percent";
export type ScriptMonsterMetric = "monster_health" | "monster_health_percent";
export type ScriptAuraMetric = "value" | "stacks";
export type ScriptInventoryLocation = "bank" | "house" | "inventory" | "temp";

/**
 * Serializable condition expression produced by the scripting DSL.
 *
 * Condition builder methods in `conditions.ts` create these plain objects
 * during script compilation. Control-flow commands such as `cmd.if(...)`
 * record the object in a `ScriptInstruction`, and `evaluateScriptCondition`
 * interprets it at runtime by dispatching on `_tag`.
 *
 * Example flow:
 * `cmd.if(cmd.hp("<", 1000))`
 *   1. `cmd.hp` builds `{ _tag: "PlayerMetric", metric: "hp", ... }`.
 *   2. `cmd.if` stores that object as the first instruction argument.
 *   3. `ifCommand` calls `evaluateScriptCondition` with that argument.
 *   4. The `"PlayerMetric"` case reads live HP and compares it to `1000`.
 */
export type ScriptCondition =
  // Logical composition nodes. Children are intentionally `unknown` because
  // script input is untrusted until `evaluateScriptCondition` validates it.
  | {
      readonly _tag: "All";
      readonly conditions: readonly unknown[];
    }
  | {
      readonly _tag: "Any";
      readonly conditions: readonly unknown[];
    }
  // Numeric metric predicates.
  | {
      readonly _tag: "PlayerMetric";
      readonly metric: ScriptPlayerMetric;
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  | {
      readonly _tag: "SelfNumberMetric";
      readonly metric: "gold" | "level";
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  | {
      readonly _tag: "PlayerNamedMetric";
      readonly metric: "hp" | "hp_percent";
      readonly player?: string;
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  | {
      readonly _tag: "AnyPlayerMetric";
      readonly metric: "hp_percent";
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  | {
      readonly _tag: "PlayerAuraPresence";
      readonly player?: string;
      readonly aura: string;
    }
  | {
      readonly _tag: "PlayerAuraMetric";
      readonly metric: ScriptAuraMetric;
      readonly player?: string;
      readonly aura: string;
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  | {
      readonly _tag: "PlayerCount";
      readonly cell?: string;
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  | {
      readonly _tag: "MonsterMetric";
      readonly metric: ScriptMonsterMetric;
      readonly target: string;
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  // Boolean, presence, inventory, location, and state predicates.
  | {
      readonly _tag: "MonsterPresence";
      readonly monster: string;
      readonly expected: boolean;
    }
  | {
      readonly _tag: "InventoryContains";
      readonly location: ScriptInventoryLocation;
      readonly item: ItemIdentifierToken;
      readonly quantity: number;
      readonly expected: boolean;
    }
  | {
      readonly _tag: "ItemState";
      readonly item: string;
      readonly quantity?: number;
      readonly state: "equipped" | "maxed" | "dropped" | "can_buy";
      readonly expected: boolean;
    }
  | {
      readonly _tag: "BooleanState";
      readonly state: "has_target" | "in_combat" | "member";
      readonly expected: boolean;
    }
  | {
      readonly _tag: "Cell";
      readonly cell: string;
      readonly expected: boolean;
    }
  | {
      readonly _tag: "Map";
      readonly map: string;
      readonly expected: boolean;
    }
  | {
      readonly _tag: "PlayerLocation";
      readonly player: string;
      readonly cell?: string;
      readonly expected: boolean;
    }
  | {
      readonly _tag: "PlayerName";
      readonly player: string;
      readonly expected: boolean;
    }
  | {
      readonly _tag: "FactionRank";
      readonly faction: string;
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  | {
      readonly _tag: "ClassRank";
      readonly className: string;
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
    }
  | {
      readonly _tag: "QuestState";
      readonly questId: number;
      readonly state: "available" | "can_complete" | "in_progress";
      readonly expected: boolean;
    }
  | {
      readonly _tag: "TargetHp";
      readonly operator: ScriptComparisonOperator;
      readonly value: number;
      readonly upper?: number;
    }
  // User-defined and logical negation predicates.
  | {
      readonly _tag: "Custom";
      readonly name: string;
      readonly args: ReadonlyArray<unknown>;
    }
  | {
      readonly _tag: "Not";
      readonly condition: unknown;
    };

const COMPARISON_OPERATOR_LOOKUP = new Map<string, ScriptComparisonOperator>([
  ["=", "eq"],
  ["==", "eq"],
  ["!=", "ne"],
  ["<", "lt"],
  ["<=", "lte"],
  [">", "gt"],
  [">=", "gte"],
]);

// Error builders

const invalidArg = (
  context: ScriptExecutionContext,
  command: string,
  message: string,
) =>
  Effect.fail(
    new ScriptInvalidArgumentError({
      sourceName: context.sourceName,
      command,
      message,
    }),
  );

const scriptArgumentError = (command: string, message: string): never => {
  throw new Error(`cmd.${command}: ${message}`);
};

// User DSL validators

export const requireScriptArgumentString = (
  command: string,
  argName: string,
  value: unknown,
): string => {
  if (typeof value !== "string" || value.trim() === "") {
    return scriptArgumentError(
      command,
      `${argName} must be a non-empty string`,
    );
  }

  return value;
};

export const readOptionalScriptArgumentString = (
  command: string,
  argName: string,
  value: unknown,
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return requireScriptArgumentString(command, argName, value);
};

export const requireScriptArgumentNumber = (
  command: string,
  argName: string,
  value: unknown,
): number => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return scriptArgumentError(command, `${argName} must be a finite number`);
  }

  return parsed;
};

export const requireScriptArgumentPositiveInteger = (
  command: string,
  argName: string,
  value: unknown,
): number => {
  const normalized = positiveInt(
    requireScriptArgumentNumber(command, argName, value),
  );
  if (normalized === undefined) {
    return scriptArgumentError(
      command,
      `${argName} must be a positive integer`,
    );
  }

  return normalized;
};

export const readOptionalScriptArgumentNumber = (
  command: string,
  argName: string,
  value: unknown,
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return requireScriptArgumentNumber(command, argName, value);
};

export const readOptionalScriptArgumentPositiveInteger = (
  command: string,
  argName: string,
  value: unknown,
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return requireScriptArgumentPositiveInteger(command, argName, value);
};

export const readOptionalScriptArgumentBoolean = (
  command: string,
  argName: string,
  value: unknown,
): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    return scriptArgumentError(command, `${argName} must be a boolean`);
  }

  return value;
};

export const readOptionalScriptArgumentObject = <T extends object>(
  command: string,
  argName: string,
  value: unknown,
): T | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return scriptArgumentError(command, `${argName} must be an object`);
  }

  return value as T;
};

export const requireScriptArgumentIdentifier = (
  command: string,
  argName: string,
  value: unknown,
): number | string => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return scriptArgumentError(
        command,
        `${argName} must be a finite number or string`,
      );
    }

    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  return scriptArgumentError(
    command,
    `${argName} must be a non-empty number or string`,
  );
};

// Runtime validators

export const requireInstructionString = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  if (typeof value !== "string" || value.trim() === "") {
    return invalidArg(
      context,
      command,
      `${argName} must be a non-empty string`,
    );
  }

  return Effect.succeed(value);
};

export const readOptionalInstructionString = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  if (value === undefined) {
    return Effect.succeed(undefined);
  }

  if (typeof value !== "string" || value.trim() === "") {
    return invalidArg(
      context,
      command,
      `${argName} must be a non-empty string`,
    );
  }

  return Effect.succeed(value);
};

export const requireInstructionNumber = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return invalidArg(context, command, `${argName} must be a finite number`);
  }

  return Effect.succeed(parsed);
};

export const requireInstructionPositiveInteger = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) =>
  Effect.flatMap(
    requireInstructionNumber(context, command, args, index, argName),
    (value) => {
      const normalized = positiveInt(value);
      return normalized === undefined
        ? invalidArg(context, command, `${argName} must be a positive integer`)
        : Effect.succeed(normalized);
    },
  );

export const readOptionalInstructionNumber = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  if (value === undefined) {
    return Effect.succeed(undefined);
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return invalidArg(context, command, `${argName} must be a finite number`);
  }

  return Effect.succeed(parsed);
};

export const readOptionalInstructionPositiveInteger = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) =>
  args[index] === undefined
    ? Effect.succeed(undefined)
    : requireInstructionPositiveInteger(context, command, args, index, argName);

export const readOptionalInstructionBoolean = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  if (value === undefined) {
    return Effect.succeed(undefined);
  }

  if (typeof value !== "boolean") {
    return invalidArg(context, command, `${argName} must be a boolean`);
  }

  return Effect.succeed(value);
};

export const readOptionalInstructionObject = <T extends object>(
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  if (value === undefined) {
    return Effect.succeed(undefined);
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalidArg(context, command, `${argName} must be an object`);
  }

  return Effect.succeed(value as T);
};

export const requireInstructionIdentifier = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return invalidArg(
        context,
        command,
        `${argName} must be a finite number or string`,
      );
    }

    return Effect.succeed(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Effect.succeed(value);
  }

  return invalidArg(
    context,
    command,
    `${argName} must be a non-empty number or string`,
  );
};

// Command registration

export const createCommandHandler =
  (
    handler: (
      context: ScriptExecutionContext,
      args: ReadonlyArray<unknown>,
      instruction: ScriptInstruction,
    ) => Effect.Effect<unknown, ScriptCommandError>,
  ): ScriptCommandHandler =>
  (context, instruction) =>
    Effect.as(
      handler(
        withInstructionFeedback(context, instruction),
        instruction.args,
        instruction,
      ),
      ScriptCommandResult.Continue,
    );

export const commandHandlerEntries = (
  name: string,
  handler: ScriptCommandHandler,
  aliases: ReadonlyArray<string> = [],
): ReadonlyArray<readonly [string, ScriptCommandHandler]> => [
  [name, handler],
  ...aliases.map((alias) => [alias, handler] as const),
];

export const defineScriptCommandHandlerMap = <
  Commands extends ScriptCommandArgumentMap<Commands>,
>(
  handlers: ScriptCommandHandlerMap<Commands>,
): ScriptCommandHandlerMap<Commands> => handlers;

export const scriptCommandHandlerEntries = <
  Commands extends ScriptCommandArgumentMap<Commands>,
>(
  handlers: ScriptCommandHandlerMap<Commands>,
): ReadonlyArray<
  readonly [ScriptCommandName<Commands>, ScriptCommandHandler]
> =>
  Object.entries(handlers) as unknown as ReadonlyArray<
    readonly [ScriptCommandName<Commands>, ScriptCommandHandler]
  >;

export const scriptCommandHandlerEntriesWithAliases = <
  Commands extends ScriptCommandArgumentMap<Commands>,
  Aliases extends ScriptCommandAliasMap<Commands>,
>(
  handlers: ScriptCommandHandlerMap<Commands>,
  aliases: Aliases,
): ReadonlyArray<
  readonly [
    ScriptCommandName<Commands> | (keyof Aliases & string),
    ScriptCommandHandler,
  ]
> => [
  ...scriptCommandHandlerEntries(handlers),
  ...Object.entries(aliases).map(
    ([alias, command]) =>
      [
        alias as keyof Aliases & string,
        handlers[command as ScriptCommandName<Commands>],
      ] as const,
  ),
];

export const withScriptCommandAliases = <
  Commands extends ScriptCommandApi,
  Aliases extends Record<string, keyof Commands & string>,
>(
  commands: Commands,
  aliases: Aliases,
): Commands & {
  readonly [Alias in keyof Aliases]: Commands[Aliases[Alias]];
} => {
  const api: Record<string, unknown> = { ...commands };

  for (const [alias, command] of Object.entries(aliases)) {
    api[alias] = commands[command];
  }

  return api as Commands & {
    readonly [Alias in keyof Aliases]: Commands[Aliases[Alias]];
  };
};

// Instruction recording

export const recordScriptInstruction = (
  emit: ScriptInstructionRecorder,
  name: string,
  ...args: ReadonlyArray<unknown>
) => {
  emit(name, args);
};

export const createTypedScriptInstructionRecorder =
  <Commands extends ScriptCommandArgumentMap<Commands>>(
    recordInstruction: ScriptInstructionRecorder,
  ) =>
  <Command extends ScriptCommandName<Commands>>(
    command: Command,
    ...args: Commands[Command]
  ) => {
    recordScriptInstruction(recordInstruction, command, ...args);
  };

export const defineScriptCommandDomain = <
  Commands extends ScriptCommandArgumentMap<Commands>,
>() => ({
  defineHandlers: (
    handlers: ScriptCommandHandlerMap<Commands>,
  ): ScriptCommandHandlerMap<Commands> => handlers,
  handlerEntries: (
    handlers: ScriptCommandHandlerMap<Commands>,
  ): ReadonlyArray<
    readonly [ScriptCommandName<Commands>, ScriptCommandHandler]
  > => scriptCommandHandlerEntries(handlers),
  handlerEntriesWithAliases: <Aliases extends ScriptCommandAliasMap<Commands>>(
    handlers: ScriptCommandHandlerMap<Commands>,
    aliases: Aliases,
  ): ReadonlyArray<
    readonly [
      ScriptCommandName<Commands> | (keyof Aliases & string),
      ScriptCommandHandler,
    ]
  > => scriptCommandHandlerEntriesWithAliases(handlers, aliases),
  createInstructionRecorder: (recordInstruction: ScriptInstructionRecorder) =>
    createTypedScriptInstructionRecorder<Commands>(recordInstruction),
});

// Constructor helpers are deliberately pure. They only build the serializable
// condition tree; no runtime state is read until `evaluateScriptCondition`
// receives the recorded instruction argument.
export const createNotCondition = (condition: unknown): ScriptCondition => ({
  _tag: "Not",
  condition,
});

export const createPlayerMetricCondition = (
  metric: ScriptPlayerMetric,
  operator: ScriptComparisonOperator,
  value: number,
): ScriptCondition => ({
  _tag: "PlayerMetric",
  metric,
  operator,
  value,
});

export const createAllCondition = (
  conditions: readonly unknown[],
): ScriptCondition => ({
  _tag: "All",
  conditions,
});

export const createAnyCondition = (
  conditions: readonly unknown[],
): ScriptCondition => ({
  _tag: "Any",
  conditions,
});

export const createMonsterMetricCondition = (
  metric: ScriptMonsterMetric,
  target: string,
  operator: ScriptComparisonOperator,
  value: number,
): ScriptCondition => ({
  _tag: "MonsterMetric",
  metric,
  target,
  operator,
  value,
});

export const createSelfNumberMetricCondition = (
  metric: "gold" | "level",
  operator: ScriptComparisonOperator,
  value: number,
): ScriptCondition => ({
  _tag: "SelfNumberMetric",
  metric,
  operator,
  value,
});

export const createPlayerNamedMetricCondition = (
  metric: "hp" | "hp_percent",
  player: string | undefined,
  operator: ScriptComparisonOperator,
  value: number,
): ScriptCondition => ({
  _tag: "PlayerNamedMetric",
  metric,
  ...(player !== undefined ? { player } : {}),
  operator,
  value,
});

export const createAnyPlayerMetricCondition = (
  metric: "hp_percent",
  operator: ScriptComparisonOperator,
  value: number,
): ScriptCondition => ({
  _tag: "AnyPlayerMetric",
  metric,
  operator,
  value,
});

export const createPlayerAuraPresenceCondition = (
  player: string | undefined,
  aura: string,
): ScriptCondition => ({
  _tag: "PlayerAuraPresence",
  ...(player !== undefined ? { player } : {}),
  aura,
});

export const createPlayerAuraMetricCondition = (
  metric: ScriptAuraMetric,
  player: string | undefined,
  aura: string,
  operator: ScriptComparisonOperator,
  value: number,
): ScriptCondition => ({
  _tag: "PlayerAuraMetric",
  metric,
  ...(player !== undefined ? { player } : {}),
  aura,
  operator,
  value,
});

export const createPlayerCountCondition = (
  operator: ScriptComparisonOperator,
  value: number,
  cell?: string,
): ScriptCondition => ({
  _tag: "PlayerCount",
  ...(cell !== undefined ? { cell } : {}),
  operator,
  value,
});

export const createMonsterPresenceCondition = (
  monster: string,
  expected: boolean,
): ScriptCondition => ({
  _tag: "MonsterPresence",
  monster,
  expected,
});

export const createInventoryContainsCondition = (
  location: ScriptInventoryLocation,
  item: ItemIdentifierToken,
  quantity: number,
  expected: boolean,
): ScriptCondition => ({
  _tag: "InventoryContains",
  location,
  item,
  quantity,
  expected,
});

export const createItemStateCondition = (
  item: string,
  state: "equipped" | "maxed" | "dropped" | "can_buy",
  expected: boolean,
  quantity?: number,
): ScriptCondition =>
  quantity === undefined
    ? {
        _tag: "ItemState",
        item,
        state,
        expected,
      }
    : {
        _tag: "ItemState",
        item,
        quantity,
        state,
        expected,
      };

export const createBooleanStateCondition = (
  state: "has_target" | "in_combat" | "member",
  expected: boolean,
): ScriptCondition => ({
  _tag: "BooleanState",
  state,
  expected,
});

export const createCellCondition = (
  cell: string,
  expected: boolean,
): ScriptCondition => ({
  _tag: "Cell",
  cell,
  expected,
});

export const createMapCondition = (
  map: string,
  expected: boolean,
): ScriptCondition => ({
  _tag: "Map",
  map,
  expected,
});

export const createPlayerLocationCondition = (
  player: string,
  expected: boolean,
  cell?: string,
): ScriptCondition => ({
  _tag: "PlayerLocation",
  player,
  ...(cell !== undefined ? { cell } : {}),
  expected,
});

export const createPlayerNameCondition = (
  player: string,
  expected: boolean,
): ScriptCondition => ({
  _tag: "PlayerName",
  player,
  expected,
});

export const createFactionRankCondition = (
  faction: string,
  operator: ScriptComparisonOperator,
  value: number,
): ScriptCondition => ({
  _tag: "FactionRank",
  faction,
  operator,
  value,
});

export const createClassRankCondition = (
  className: string,
  operator: ScriptComparisonOperator,
  value: number,
): ScriptCondition => ({
  _tag: "ClassRank",
  className,
  operator,
  value,
});

export const createQuestStateCondition = (
  questId: number,
  state: "available" | "can_complete" | "in_progress",
  expected: boolean,
): ScriptCondition => ({
  _tag: "QuestState",
  questId,
  state,
  expected,
});

export const createTargetHpCondition = (
  operator: ScriptComparisonOperator,
  value: number,
  upper?: number,
): ScriptCondition => ({
  _tag: "TargetHp",
  operator,
  value,
  ...(upper !== undefined ? { upper } : {}),
});

export const createCustomCondition = (
  name: string,
  args: ReadonlyArray<unknown>,
): ScriptCondition => ({
  _tag: "Custom",
  name,
  args: [...args],
});

const normalizeComparisonOperator = (
  value: unknown,
): ScriptComparisonOperator | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return COMPARISON_OPERATOR_LOOKUP.get(value.trim().toLowerCase());
};

/**
 * Normalizes user-facing symbolic comparisons into the compact internal
 * operator tokens stored on `ScriptCondition`.
 *
 * This runs while the DSL is building the condition object, so invalid script
 * input fails before the instruction is recorded.
 */
export const readScriptComparison = (
  command: string,
  operatorInput: unknown,
  valueInput: unknown,
): {
  readonly operator: ScriptComparisonOperator;
  readonly value: number;
} => {
  const operator = normalizeComparisonOperator(operatorInput);
  if (operator !== undefined) {
    return {
      operator,
      value: requireScriptArgumentNumber(command, "value", valueInput),
    };
  }

  return scriptArgumentError(
    command,
    "comparison must be provided as (operator, value)",
  );
};

const compareNumbers = (
  left: number,
  operator: ScriptComparisonOperator,
  right: number,
): boolean => {
  switch (operator) {
    case "eq":
      return left === right;
    case "ne":
      return left !== right;
    case "lt":
      return left < right;
    case "lte":
      return left <= right;
    case "gt":
      return left > right;
    case "gte":
      return left >= right;
  }
};

const readPlayerMetricValue = (
  context: ScriptExecutionContext,
  metric: ScriptPlayerMetric,
): Effect.Effect<number, ScriptCommandError> => {
  switch (metric) {
    case "hp":
      return context.player.getHp();
    case "mp":
      return context.player.getMp();
    case "hp_percent":
      return Effect.all([
        context.player.getHp(),
        context.player.getMaxHp(),
      ]).pipe(
        Effect.map(([hp, maxHp]) => (maxHp <= 0 ? 0 : (hp / maxHp) * 100)),
      );
    case "mp_percent":
      return Effect.all([
        context.player.getMp(),
        context.player.getMaxMp(),
      ]).pipe(
        Effect.map(([mp, maxMp]) => (maxMp <= 0 ? 0 : (mp / maxMp) * 100)),
      );
  }
};

const readMonsterMetricValue = (
  context: ScriptExecutionContext,
  metric: ScriptMonsterMetric,
  target: string,
): Effect.Effect<number | undefined, ScriptCommandError> =>
  context.world.monsters.findByName(target).pipe(
    Effect.map((monster) => {
      if (Option.isNone(monster)) {
        return undefined;
      }

      switch (metric) {
        case "monster_health":
          return monster.value.hp;
        case "monster_health_percent":
          return monster.value.hpPercentage;
      }
    }),
  );

const parseMapAndRoom = (
  map: string,
): { readonly map: string; readonly room?: number } => {
  const separatorIndex = map.lastIndexOf("-");
  if (separatorIndex === -1) {
    return { map };
  }

  const roomToken = map.slice(separatorIndex + 1);
  if (!/^\d+$/.test(roomToken)) {
    return { map };
  }

  return {
    map: map.slice(0, separatorIndex),
    room: Number.parseInt(roomToken, 10),
  };
};

const evaluateInventoryContains = (
  context: ScriptExecutionContext,
  condition: Extract<ScriptCondition, { readonly _tag: "InventoryContains" }>,
) => {
  const effect =
    condition.location === "inventory"
      ? context.inventory.contains(condition.item, condition.quantity)
      : condition.location === "temp"
        ? context.tempInventory.contains(condition.item, condition.quantity)
        : condition.location === "bank"
          ? context.bank.contains(condition.item, condition.quantity)
          : Effect.gen(function* () {
              const item = yield* context.house.getItem(condition.item);
              return (item?.quantity ?? 0) >= condition.quantity;
            });

  return effect.pipe(
    Effect.map((contains) => (condition.expected ? contains : !contains)),
  );
};

const evaluateItemState = (
  context: ScriptExecutionContext,
  condition: Extract<ScriptCondition, { readonly _tag: "ItemState" }>,
) =>
  Effect.gen(function* () {
    let actual = false;
    switch (condition.state) {
      case "equipped": {
        const item = yield* context.inventory.getItem(condition.item);
        actual = item?.isEquipped() ?? false;
        break;
      }
      case "maxed": {
        const item = yield* context.inventory.getItem(condition.item);
        actual = item?.isMaxed() ?? false;
        break;
      }
      case "dropped":
        actual = yield* context.drops.containsDrop(condition.item);
        break;
      case "can_buy":
        actual = yield* context.shops.canBuyItem(
          condition.item,
          condition.quantity,
        );
        break;
    }

    return condition.expected ? actual : !actual;
  });

const evaluateBooleanState = (
  context: ScriptExecutionContext,
  condition: Extract<ScriptCondition, { readonly _tag: "BooleanState" }>,
) =>
  Effect.gen(function* () {
    const actual =
      condition.state === "has_target"
        ? yield* context.combat.hasTarget()
        : condition.state === "member"
          ? yield* context.player.isMember()
          : (yield* context.player.getState()) === EntityState.InCombat;

    return condition.expected ? actual : !actual;
  });

const evaluatePlayerNamedMetric = (
  context: ScriptExecutionContext,
  condition: Extract<ScriptCondition, { readonly _tag: "PlayerNamedMetric" }>,
) =>
  Effect.gen(function* () {
    const player =
      condition.player === undefined
        ? yield* context.world.players.getSelf()
        : yield* context.world.players.getByName(condition.player);

    if (Option.isNone(player)) {
      return false;
    }

    const actual =
      condition.metric === "hp" ? player.value.hp : player.value.hpPercentage;
    return compareNumbers(actual, condition.operator, condition.value);
  });

const getConditionPlayerAura = (
  context: ScriptExecutionContext,
  condition: {
    readonly player?: string;
    readonly aura: string;
  },
) =>
  Effect.gen(function* () {
    const player =
      condition.player === undefined
        ? yield* context.world.players.getSelf()
        : yield* context.world.players.getByName(condition.player);

    if (Option.isNone(player)) {
      return Option.none();
    }

    return yield* context.world.players.getAura(
      player.value.data.entID,
      condition.aura,
    );
  });

const evaluatePlayerAuraPresence = (
  context: ScriptExecutionContext,
  condition: Extract<ScriptCondition, { readonly _tag: "PlayerAuraPresence" }>,
) =>
  Effect.map(getConditionPlayerAura(context, condition), (aura) =>
    Option.isSome(aura),
  );

const evaluatePlayerAuraMetric = (
  context: ScriptExecutionContext,
  condition: Extract<ScriptCondition, { readonly _tag: "PlayerAuraMetric" }>,
) =>
  Effect.gen(function* () {
    const aura = yield* getConditionPlayerAura(context, condition);
    if (Option.isNone(aura)) {
      return false;
    }

    const actual =
      condition.metric === "value" ? aura.value.value : (aura.value.stack ?? 1);

    if (actual === undefined) {
      return false;
    }

    return compareNumbers(actual, condition.operator, condition.value);
  });

const evaluateAnyPlayerMetric = (
  context: ScriptExecutionContext,
  condition: Extract<ScriptCondition, { readonly _tag: "AnyPlayerMetric" }>,
) =>
  Effect.gen(function* () {
    const players = yield* context.world.players.getAll();
    for (const player of players.values()) {
      const actual = player.hpPercentage;
      if (compareNumbers(actual, condition.operator, condition.value)) {
        return true;
      }
    }

    return false;
  });

const evaluatePlayerCount = (
  context: ScriptExecutionContext,
  condition: Extract<ScriptCondition, { readonly _tag: "PlayerCount" }>,
) =>
  Effect.gen(function* () {
    const self = yield* context.world.players.getSelf();
    const players = yield* context.world.players.getAll();
    const targetCell =
      condition.cell ?? (Option.isSome(self) ? self.value.cell : undefined);
    let count = 0;

    for (const player of players.values()) {
      if (
        targetCell === undefined ||
        equalsIgnoreCase(player.cell, targetCell)
      ) {
        count += 1;
      }
    }

    return compareNumbers(count, condition.operator, condition.value);
  });

/**
 * Runtime interpreter for `ScriptCondition`.
 *
 * This is the only place condition expressions should touch game/runtime
 * services. It revalidates every field because compiled scripts and custom
 * conditions can still pass arbitrary objects at runtime.
 *
 * Add new condition types by pairing a pure `create*Condition` constructor
 * with a `_tag` case here. The public DSL should build the object; this
 * function should read the runtime state and decide true or false.
 */
export const evaluateScriptCondition = (
  context: ScriptExecutionContext,
  command: string,
  raw: unknown,
): Effect.Effect<boolean, ScriptCommandError> => {
  if (typeof raw === "boolean") {
    return Effect.succeed(raw);
  }

  if (typeof raw !== "object" || raw === null) {
    return invalidArg(
      context,
      command,
      "condition must be a valid condition expression",
    );
  }

  const condition = raw as Partial<ScriptCondition>;

  switch (condition._tag) {
    case "All": {
      const conditions = condition.conditions;
      if (!Array.isArray(conditions)) {
        return invalidArg(
          context,
          command,
          "all condition requires conditions",
        );
      }

      return Effect.gen(function* () {
        for (const child of conditions) {
          if (!(yield* evaluateScriptCondition(context, command, child))) {
            return false;
          }
        }

        return true;
      });
    }
    case "Any": {
      const conditions = condition.conditions;
      if (!Array.isArray(conditions)) {
        return invalidArg(
          context,
          command,
          "any condition requires conditions",
        );
      }

      return Effect.gen(function* () {
        for (const child of conditions) {
          if (yield* evaluateScriptCondition(context, command, child)) {
            return true;
          }
        }

        return false;
      });
    }
    case "PlayerMetric": {
      const metric = condition.metric;
      if (
        metric !== "hp" &&
        metric !== "hp_percent" &&
        metric !== "mp" &&
        metric !== "mp_percent"
      ) {
        return invalidArg(
          context,
          command,
          "condition metric is not supported",
        );
      }

      const operator = condition.operator;
      if (
        operator !== "eq" &&
        operator !== "ne" &&
        operator !== "lt" &&
        operator !== "lte" &&
        operator !== "gt" &&
        operator !== "gte"
      ) {
        return invalidArg(
          context,
          command,
          "condition operator is not supported",
        );
      }

      const value = condition.value;
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return invalidArg(
          context,
          command,
          "condition value must be a finite number",
        );
      }

      return Effect.map(readPlayerMetricValue(context, metric), (actual) =>
        compareNumbers(actual, operator, value),
      );
    }
    case "SelfNumberMetric": {
      const metric = condition.metric;
      if (metric !== "gold" && metric !== "level") {
        return invalidArg(
          context,
          command,
          "condition metric is not supported",
        );
      }

      const operator = condition.operator;
      const value = condition.value;
      if (
        (operator !== "eq" &&
          operator !== "ne" &&
          operator !== "lt" &&
          operator !== "lte" &&
          operator !== "gt" &&
          operator !== "gte") ||
        typeof value !== "number" ||
        !Number.isFinite(value)
      ) {
        return invalidArg(context, command, "condition comparison is invalid");
      }

      const actual =
        metric === "gold"
          ? context.player.getGold()
          : context.player.getLevel();
      return actual.pipe(
        Effect.map((metricValue) =>
          compareNumbers(metricValue, operator, value),
        ),
      );
    }
    case "PlayerNamedMetric":
      return evaluatePlayerNamedMetric(
        context,
        condition as Extract<
          ScriptCondition,
          { readonly _tag: "PlayerNamedMetric" }
        >,
      );
    case "PlayerAuraPresence": {
      if (typeof condition.aura !== "string" || condition.aura.trim() === "") {
        return invalidArg(context, command, "condition aura is required");
      }

      if (
        condition.player !== undefined &&
        (typeof condition.player !== "string" || condition.player.trim() === "")
      ) {
        return invalidArg(context, command, "condition player is invalid");
      }

      return evaluatePlayerAuraPresence(
        context,
        condition as Extract<
          ScriptCondition,
          { readonly _tag: "PlayerAuraPresence" }
        >,
      );
    }
    case "PlayerAuraMetric": {
      const metric = condition.metric;
      const operator = condition.operator;
      const value = condition.value;

      if (metric !== "value" && metric !== "stacks") {
        return invalidArg(
          context,
          command,
          "condition aura metric is not supported",
        );
      }

      if (typeof condition.aura !== "string" || condition.aura.trim() === "") {
        return invalidArg(context, command, "condition aura is required");
      }

      if (
        condition.player !== undefined &&
        (typeof condition.player !== "string" || condition.player.trim() === "")
      ) {
        return invalidArg(context, command, "condition player is invalid");
      }

      if (
        (operator !== "eq" &&
          operator !== "ne" &&
          operator !== "lt" &&
          operator !== "lte" &&
          operator !== "gt" &&
          operator !== "gte") ||
        typeof value !== "number" ||
        !Number.isFinite(value)
      ) {
        return invalidArg(context, command, "condition comparison is invalid");
      }

      return evaluatePlayerAuraMetric(
        context,
        condition as Extract<
          ScriptCondition,
          { readonly _tag: "PlayerAuraMetric" }
        >,
      );
    }
    case "AnyPlayerMetric":
      return evaluateAnyPlayerMetric(
        context,
        condition as Extract<
          ScriptCondition,
          { readonly _tag: "AnyPlayerMetric" }
        >,
      );
    case "PlayerCount":
      return evaluatePlayerCount(
        context,
        condition as Extract<ScriptCondition, { readonly _tag: "PlayerCount" }>,
      );
    case "MonsterMetric": {
      const metric = condition.metric;
      if (metric !== "monster_health" && metric !== "monster_health_percent") {
        return invalidArg(
          context,
          command,
          "condition metric is not supported",
        );
      }

      const target = condition.target;
      if (typeof target !== "string" || target.trim() === "") {
        return invalidArg(
          context,
          command,
          "condition target must be a non-empty string",
        );
      }

      const operator = condition.operator;
      if (
        operator !== "eq" &&
        operator !== "ne" &&
        operator !== "lt" &&
        operator !== "lte" &&
        operator !== "gt" &&
        operator !== "gte"
      ) {
        return invalidArg(
          context,
          command,
          "condition operator is not supported",
        );
      }

      const value = condition.value;
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return invalidArg(
          context,
          command,
          "condition value must be a finite number",
        );
      }

      return Effect.map(
        readMonsterMetricValue(context, metric, target),
        (actual) =>
          actual === undefined
            ? false
            : compareNumbers(actual, operator, value),
      );
    }
    case "MonsterPresence": {
      const monster = condition.monster;
      if (typeof monster !== "string" || monster.trim() === "") {
        return invalidArg(
          context,
          command,
          "monster must be a non-empty string",
        );
      }

      return context.world.monsters.findByName(monster).pipe(
        Effect.map((match) => {
          const actual = Option.isSome(match) && match.value.alive;
          return condition.expected ? actual : !actual;
        }),
      );
    }
    case "InventoryContains":
      return evaluateInventoryContains(
        context,
        condition as Extract<
          ScriptCondition,
          { readonly _tag: "InventoryContains" }
        >,
      );
    case "ItemState":
      return evaluateItemState(
        context,
        condition as Extract<ScriptCondition, { readonly _tag: "ItemState" }>,
      );
    case "BooleanState":
      return evaluateBooleanState(
        context,
        condition as Extract<
          ScriptCondition,
          { readonly _tag: "BooleanState" }
        >,
      );
    case "Cell": {
      const cell = condition.cell;
      if (typeof cell !== "string" || cell.trim() === "") {
        return invalidArg(context, command, "cell must be a non-empty string");
      }

      return context.player.getCell().pipe(
        Effect.map((actualCell) => {
          const actual = equalsIgnoreCase(actualCell, cell);
          return condition.expected ? actual : !actual;
        }),
      );
    }
    case "Map": {
      const map = condition.map;
      if (typeof map !== "string" || map.trim() === "") {
        return invalidArg(context, command, "map must be a non-empty string");
      }

      const target = parseMapAndRoom(map);
      return Effect.all([
        context.world.map.getName(),
        context.world.map.getRoomNumber(),
      ]).pipe(
        Effect.map(([currentMap, currentRoom]) => {
          const actual =
            equalsIgnoreCase(currentMap, target.map) &&
            (target.room === undefined || currentRoom === target.room);
          return condition.expected ? actual : !actual;
        }),
      );
    }
    case "PlayerLocation": {
      const playerName = condition.player;
      if (typeof playerName !== "string" || playerName.trim() === "") {
        return invalidArg(
          context,
          command,
          "player must be a non-empty string",
        );
      }

      return context.world.players.getByName(playerName).pipe(
        Effect.map((player) => {
          const actual =
            Option.isSome(player) &&
            (condition.cell === undefined ||
              equalsIgnoreCase(player.value.cell, condition.cell));
          return condition.expected ? actual : !actual;
        }),
      );
    }
    case "PlayerName": {
      const playerName = condition.player;
      if (typeof playerName !== "string" || playerName.trim() === "") {
        return invalidArg(
          context,
          command,
          "player must be a non-empty string",
        );
      }

      return context.auth.getUsername().pipe(
        Effect.map((username) => {
          const actual = equalsIgnoreCase(username, playerName);
          return condition.expected ? actual : !actual;
        }),
      );
    }
    case "FactionRank": {
      const factionName = condition.faction;
      if (typeof factionName !== "string" || factionName.trim() === "") {
        return invalidArg(
          context,
          command,
          "faction must be a non-empty string",
        );
      }

      return context.player.getFactions().pipe(
        Effect.map((factions) => {
          const faction = factions.find((candidate) =>
            equalsIgnoreCase(candidate.name, factionName),
          );
          return compareNumbers(
            faction?.rank ?? 0,
            condition.operator as ScriptComparisonOperator,
            condition.value as number,
          );
        }),
      );
    }
    case "ClassRank": {
      const className = condition.className;
      if (typeof className !== "string" || className.trim() === "") {
        return invalidArg(
          context,
          command,
          "className must be a non-empty string",
        );
      }

      return context
        .run(context.inventory.getItem(className))
        .pipe(
          Effect.map((item) =>
            compareNumbers(
              item?.classRank ?? 0,
              condition.operator as ScriptComparisonOperator,
              condition.value as number,
            ),
          ),
        );
    }
    case "QuestState": {
      const questId = condition.questId;
      if (typeof questId !== "number" || !Number.isFinite(questId)) {
        return invalidArg(context, command, "quest id must be a finite number");
      }

      const actual =
        condition.state === "available"
          ? context.quests.isAvailable(questId)
          : condition.state === "can_complete"
            ? context.quests.canComplete(questId)
            : context.quests.isInProgress(questId);

      return actual.pipe(
        Effect.map((matched) => (condition.expected ? matched : !matched)),
      );
    }
    case "TargetHp":
      return context.combat.getTarget().pipe(
        Effect.map((target) => {
          const hp = target?.hp ?? 0;
          if (
            condition.operator === "gt" &&
            typeof condition.upper === "number"
          ) {
            return hp > (condition.value as number) && hp < condition.upper;
          }

          return compareNumbers(
            hp,
            condition.operator as ScriptComparisonOperator,
            condition.value as number,
          );
        }),
      );
    case "Custom": {
      const name = condition.name;
      if (typeof name !== "string" || name.trim() === "") {
        return invalidArg(
          context,
          command,
          "custom condition name must be a non-empty string",
        );
      }

      const args = condition.args;
      if (!Array.isArray(args)) {
        return invalidArg(
          context,
          command,
          "custom condition args must be an array",
        );
      }

      return context.evaluateCustomCondition(name, args);
    }
    case "Not":
      return Effect.map(
        evaluateScriptCondition(context, command, condition.condition),
        (result) => !result,
      );
    default:
      return invalidArg(
        context,
        command,
        "condition must be a valid condition expression",
      );
  }
};
