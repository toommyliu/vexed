import { Effect } from "effect";
import { ScriptInvalidArgumentError } from "../Errors";
import {
  ScriptCommandResult,
  type ScriptCommandError,
  type ScriptCommandHandler,
  type ScriptExecutionContext,
} from "../Types";

type KillCommandOptions = {
  readonly skillSet: ReadonlyArray<number>;
  readonly skillDelayMs: number;
  readonly maxRotations: number;
};

const DEFAULT_SKILL_SET = [1, 2, 3, 4] as const;

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

const expectString = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  if (typeof value !== "string" || value.trim() === "") {
    return invalidArg(context, command, `${argName} must be a non-empty string`);
  }

  return Effect.succeed(value);
};

const readOptionalString = (
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
    return invalidArg(context, command, `${argName} must be a non-empty string`);
  }

  return Effect.succeed(value);
};

const expectNumber = (
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

const readKillOptions = (raw: unknown): KillCommandOptions => {
  if (typeof raw !== "object" || raw === null) {
    return {
      skillSet: DEFAULT_SKILL_SET,
      skillDelayMs: 350,
      maxRotations: 25,
    };
  }

  const record = raw as Record<string, unknown>;

  const rawSkillSet = record["skillSet"];
  const skillSet = Array.isArray(rawSkillSet)
    ? rawSkillSet
        .map((entry) =>
          typeof entry === "number"
            ? entry
            : typeof entry === "string"
              ? Number(entry)
              : Number.NaN,
        )
        .filter((entry) => Number.isFinite(entry) && entry >= 0)
    : [...DEFAULT_SKILL_SET];

  const skillDelayRaw = record["skillDelay"];
  const skillDelayMs =
    typeof skillDelayRaw === "number" && Number.isFinite(skillDelayRaw)
      ? Math.max(0, Math.floor(skillDelayRaw))
      : 350;

  const maxRotationsRaw = record["maxRotations"];
  const maxRotations =
    typeof maxRotationsRaw === "number" && Number.isFinite(maxRotationsRaw)
      ? Math.max(1, Math.floor(maxRotationsRaw))
      : 25;

  return {
    skillSet: skillSet.length > 0 ? skillSet : DEFAULT_SKILL_SET,
    skillDelayMs,
    maxRotations,
  };
};

const asContinue = <E>(effect: Effect.Effect<unknown, E>) =>
  Effect.as(effect, ScriptCommandResult.Continue);

const makeSimple = (
  handler: (
    context: ScriptExecutionContext,
    args: ReadonlyArray<unknown>,
  ) => Effect.Effect<unknown, ScriptCommandError>,
): ScriptCommandHandler => (context, args) => asContinue(handler(context, args));

const joinCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const map = yield* expectString(context, "join", args, 0, "map");
    const cell = yield* readOptionalString(context, "join", args, 1, "cell");
    const pad = yield* readOptionalString(context, "join", args, 2, "pad");

    yield* context.run(context.player.joinMap(map, cell, pad));
  }),
);

const moveToCellCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const cell = yield* expectString(context, "move_to_cell", args, 0, "cell");
    const pad = yield* readOptionalString(context, "move_to_cell", args, 1, "pad");

    yield* context.run(context.player.jump(cell, pad));
  }),
);

const gotoPlayerCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const player = yield* expectString(context, "goto_player", args, 0, "player");
    yield* context.run(context.player.goToPlayer(player));
  }),
);

const gotoHouseCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const player = yield* readOptionalString(context, "goto_house", args, 0, "player");
    const houseMap = player === undefined ? "house" : `${player}-house`;

    yield* context.run(context.player.joinMap(houseMap));
  }),
);

const setSpawnPointCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const cell = yield* readOptionalString(context, "set_spawnpoint", args, 0, "cell");
    const pad = yield* readOptionalString(context, "set_spawnpoint", args, 1, "pad");

    yield* context.run(context.world.setSpawnPoint(cell, pad));
  }),
);

const setFpsCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const fps = yield* expectNumber(context, "set_fps", args, 0, "fps");
    yield* context.run(context.settings.setFPS(Math.max(1, Math.floor(fps))));
  }),
);

const delayCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const ms = yield* expectNumber(context, "delay", args, 0, "ms");
    const delayMs = Math.max(0, Math.floor(ms));

    yield* Effect.sleep(`${delayMs} millis`);
  }),
);

const logCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const message = yield* expectString(context, "log", args, 0, "message");
    yield* Effect.sync(() => {
      console.info(`[script:${context.sourceName}] ${message}`);
    });
  }),
);

const useSkillCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const skill = yield* expectNumber(context, "use_skill", args, 0, "skill");
    yield* context.run(context.combat.useSkill(Math.max(0, Math.floor(skill))));
  }),
);

const attackCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const target = yield* expectString(context, "attack", args, 0, "target");
    yield* context.run(context.combat.attackMonster(target));
  }),
);

const equipItemCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const item = yield* expectString(context, "equip_item", args, 0, "item");
    yield* context.run(context.bridge.call("inventory.equip", [item]));
  }),
);

const killCommand = makeSimple((context, args) =>
  Effect.gen(function* () {
    const target = yield* expectString(context, "kill", args, 0, "target");
    const options = readKillOptions(args[1]);

    yield* Effect.repeat(
      Effect.gen(function* () {
        yield* context.run(context.combat.attackMonster(target));

        for (const skill of options.skillSet) {
          yield* context.run(context.combat.useSkill(skill));
          if (options.skillDelayMs > 0) {
            yield* Effect.sleep(`${options.skillDelayMs} millis`);
          }
        }
      }),
      {
        times: options.maxRotations - 1,
      },
    );
  }),
);

const gotoLabelCommand: ScriptCommandHandler = (context, args) =>
  Effect.gen(function* () {
    const label = yield* expectString(context, "goto_label", args, 0, "label");
    return ScriptCommandResult.JumpToLabel(label);
  });

const labelCommand: ScriptCommandHandler = (context, args) =>
  Effect.gen(function* () {
    yield* expectString(context, "label", args, 0, "label");
    return ScriptCommandResult.Continue;
  });

const stopBotCommand: ScriptCommandHandler = () => Effect.succeed(ScriptCommandResult.Stop);

// Extend this list with additional [commandName, handler] entries.
// Handlers stay small and testable while the ScriptRunner handles queueing,
// readiness checks, and fiber lifecycle concerns.
export const coreScriptCommands: ReadonlyArray<readonly [string, ScriptCommandHandler]> =
  [
    ["label", labelCommand],
    ["goto_label", gotoLabelCommand],
    ["stop_bot", stopBotCommand],
    ["delay", delayCommand],
    ["log", logCommand],
    ["join", joinCommand],
    ["join_map", joinCommand],
    ["move_to_cell", moveToCellCommand],
    ["jump_to_cell", moveToCellCommand],
    ["goto_player", gotoPlayerCommand],
    ["goto_house", gotoHouseCommand],
    ["set_spawn", setSpawnPointCommand],
    ["set_spawnpoint", setSpawnPointCommand],
    ["set_fps", setFpsCommand],
    ["enable_lagkiller", makeSimple((context) => context.run(context.settings.lagKiller(true)))],
    ["disable_lagkiller", makeSimple((context) => context.run(context.settings.lagKiller(false)))],
    ["enable_hideplayers", makeSimple((context) => context.run(context.settings.setHidePlayers(true)))],
    ["disable_hideplayers", makeSimple((context) => context.run(context.settings.setHidePlayers(false)))],
    ["enable_infiniterange", makeSimple((context) => context.run(context.settings.infiniteRange()))],
    ["attack", attackCommand],
    ["use_skill", useSkillCommand],
    ["buff", makeSimple((context) =>
      Effect.forEach([1, 2, 3], (skill) =>
        context.run(context.combat.useSkill(skill)).pipe(
          Effect.andThen(Effect.sleep("250 millis")),
        ),
      ).pipe(Effect.asVoid),
    )],
    ["equip_item", equipItemCommand],
    ["kill", killCommand],
  ];
