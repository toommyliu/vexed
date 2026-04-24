import { positiveInt } from "@vexed/shared/number";
import { Effect, Option } from "effect";
import { ScriptInvalidArgumentError } from "../Errors";
import {
  ScriptCommandResult,
  type ScriptCommandError,
  type ScriptCommandHandler,
  type ScriptExecutionContext,
  type ScriptInstruction,
} from "../Types";

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
  | "eq"
  | "ne"
  | "lt"
  | "lte"
  | "gt"
  | "gte";

export type ScriptComparisonOperatorInput =
  | "is"
  | "is not"
  | "below"
  | "at most"
  | "above"
  | "at least"
  | "="
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">=";

export type ScriptPlayerMetric = "hp" | "hp_percent" | "mp" | "mp_percent";
export type ScriptMonsterMetric = "monster_health" | "monster_health_percent";

export type ScriptCondition =
  | {
      readonly _tag: "PlayerMetric";
      readonly metric: ScriptPlayerMetric;
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
  | {
      readonly _tag: "Not";
      readonly condition: unknown;
    };

const COMPARISON_OPERATOR_LOOKUP = new Map<string, ScriptComparisonOperator>([
  ["is", "eq"],
  ["=", "eq"],
  ["==", "eq"],
  ["is not", "ne"],
  ["!=", "ne"],
  ["below", "lt"],
  ["<", "lt"],
  ["at most", "lte"],
  ["<=", "lte"],
  ["above", "gt"],
  [">", "gt"],
  ["at least", "gte"],
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
      handler(context, instruction.args, instruction),
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

const normalizeComparisonOperator = (
  value: unknown,
): ScriptComparisonOperator | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return COMPARISON_OPERATOR_LOOKUP.get(value.trim().toLowerCase());
};

export const readScriptComparison = (
  command: string,
  left: unknown,
  right: unknown,
): {
  readonly operator: ScriptComparisonOperator;
  readonly value: number;
} => {
  const leftOperator = normalizeComparisonOperator(left);
  if (leftOperator !== undefined) {
    return {
      operator: leftOperator,
      value: requireScriptArgumentNumber(command, "value", right),
    };
  }

  const rightOperator = normalizeComparisonOperator(right);
  if (rightOperator !== undefined) {
    return {
      operator: rightOperator,
      value: requireScriptArgumentNumber(command, "value", left),
    };
  }

  return scriptArgumentError(
    command,
    "comparison must be provided as (operator, value) or (value, operator)",
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
      return context.run(context.player.getHp());
    case "mp":
      return context.run(context.player.getMp());
    case "hp_percent":
      return Effect.all([
        context.run(context.player.getHp()),
        context.run(context.player.getMaxHp()),
      ]).pipe(
        Effect.map(([hp, maxHp]) => (maxHp <= 0 ? 0 : (hp / maxHp) * 100)),
      );
    case "mp_percent":
      return Effect.all([
        context.run(context.player.getMp()),
        context.run(context.player.getMaxMp()),
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
