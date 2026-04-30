import { Effect } from "effect";
import { expect, test } from "vitest";
import { createScriptDsl, scriptCommandHandlers } from ".";
import type { ScriptExecutionContext } from "../Types";
import { evaluateScriptCondition } from "./commandDsl";

type CommandMap = Record<string, (...args: unknown[]) => unknown> & {
  if(condition: unknown): unknown;
  hp(operator: unknown, value: unknown): unknown;
  mp(operator: unknown, value: unknown): unknown;
  hp_percentage(operator: unknown, value: unknown): unknown;
  mp_percentage(operator: unknown, value: unknown): unknown;
  gold(operator: unknown, value: unknown): unknown;
  level(operator: unknown, value: unknown): unknown;
  faction_rank(faction: unknown, operator: unknown, value: unknown): unknown;
  class_rank(className: unknown, operator: unknown, value: unknown): unknown;
  player_hp(player: unknown, operator: unknown, value: unknown): unknown;
  player_hp_percentage(
    player: unknown,
    operator: unknown,
    value: unknown,
  ): unknown;
  any_player_hp_percentage(operator: unknown, value: unknown): unknown;
  player_count(operator: unknown, value: unknown): unknown;
  cell_player_count(operator: unknown, value: unknown, cell?: unknown): unknown;
  player_aura(
    player: unknown,
    aura: unknown,
    operator: unknown,
    value: unknown,
  ): unknown;
  target_hp(operator: unknown, value: unknown): unknown;
  monster_hp(target: unknown, operator: unknown, value: unknown): unknown;
  monster_hp_percentage(
    target: unknown,
    operator: unknown,
    value: unknown,
  ): unknown;
  can_buy_item(item: unknown, quantity?: unknown): unknown;
};
type RecordedInstruction = {
  readonly name: string;
  readonly args: ReadonlyArray<unknown>;
};

const createRecordedCommandMap = () => {
  const instructions: RecordedInstruction[] = [];
  const cmd = createScriptDsl((name, args) => {
    instructions.push({ name, args: [...args] });
  }) as CommandMap;

  return { cmd, instructions };
};

const createMetricContext = ({
  hp,
  maxHp,
  mp,
  maxMp,
}: {
  readonly hp: number;
  readonly maxHp: number;
  readonly mp: number;
  readonly maxMp: number;
}) =>
  ({
    sourceName: "conditions.test.ts",
    player: {
      getHp: () => Effect.succeed(hp),
      getMaxHp: () => Effect.succeed(maxHp),
      getMp: () => Effect.succeed(mp),
      getMaxMp: () => Effect.succeed(maxMp),
    },
    run: (effect: Effect.Effect<unknown, unknown>) => effect,
  }) as unknown as ScriptExecutionContext;

const expectRecordedPlayerMetricCondition = (
  buildCondition: (cmd: CommandMap) => unknown,
  expected: {
    readonly metric: string;
    readonly operator: string;
    readonly value: number;
  },
) => {
  const { cmd, instructions } = createRecordedCommandMap();

  cmd.if(buildCondition(cmd));

  expect(instructions).toEqual([
    {
      name: "if",
      args: [
        {
          _tag: "PlayerMetric",
          metric: expected.metric,
          operator: expected.operator,
          value: expected.value,
        },
      ],
    },
  ]);
};

const expectRecordedCondition = (
  buildCondition: (cmd: CommandMap) => unknown,
  expected: unknown,
) => {
  const { cmd, instructions } = createRecordedCommandMap();

  cmd.if(buildCondition(cmd));

  expect(instructions).toEqual([{ name: "if", args: [expected] }]);
};

test("records self HP conditions through PlayerMetric", () => {
  expectRecordedPlayerMetricCondition((cmd) => cmd.hp("<", 1000), {
    metric: "hp",
    operator: "lt",
    value: 1000,
  });
});

test("records self MP conditions through PlayerMetric", () => {
  expectRecordedPlayerMetricCondition((cmd) => cmd.mp(">=", 30), {
    metric: "mp",
    operator: "gte",
    value: 30,
  });
});

test("records self HP percentage conditions through PlayerMetric", () => {
  expectRecordedPlayerMetricCondition((cmd) => cmd.hp_percentage("<=", 40), {
    metric: "hp_percent",
    operator: "lte",
    value: 40,
  });
});

test("records self MP percentage conditions through PlayerMetric", () => {
  expectRecordedPlayerMetricCondition((cmd) => cmd.mp_percentage(">", 20), {
    metric: "mp_percent",
    operator: "gt",
    value: 20,
  });
});

test("records other numeric conditions through operator-based builders", () => {
  expectRecordedCondition((cmd) => cmd.gold(">=", 1_000_000), {
    _tag: "SelfNumberMetric",
    metric: "gold",
    operator: "gte",
    value: 1_000_000,
  });
  expectRecordedCondition((cmd) => cmd.level("=", 100), {
    _tag: "SelfNumberMetric",
    metric: "level",
    operator: "eq",
    value: 100,
  });
  expectRecordedCondition((cmd) => cmd.faction_rank("Good", ">=", 10), {
    _tag: "FactionRank",
    faction: "Good",
    operator: "gte",
    value: 10,
  });
  expectRecordedCondition((cmd) => cmd.class_rank("ArchPaladin", ">=", 10), {
    _tag: "ClassRank",
    className: "ArchPaladin",
    operator: "gte",
    value: 10,
  });
  expectRecordedCondition((cmd) => cmd.player_hp("Artix", "<", 1000), {
    _tag: "PlayerNamedMetric",
    metric: "hp",
    player: "Artix",
    operator: "lt",
    value: 1000,
  });
  expectRecordedCondition(
    (cmd) => cmd.player_hp_percentage("Artix", "<=", 40),
    {
      _tag: "PlayerNamedMetric",
      metric: "hp_percent",
      player: "Artix",
      operator: "lte",
      value: 40,
    },
  );
  expectRecordedCondition((cmd) => cmd.any_player_hp_percentage("<", 25), {
    _tag: "AnyPlayerMetric",
    metric: "hp_percent",
    operator: "lt",
    value: 25,
  });
  expectRecordedCondition((cmd) => cmd.player_count(">=", 3), {
    _tag: "PlayerCount",
    operator: "gte",
    value: 3,
  });
  expectRecordedCondition((cmd) => cmd.cell_player_count(">=", 2, "Enter"), {
    _tag: "PlayerCount",
    cell: "Enter",
    operator: "gte",
    value: 2,
  });
  expectRecordedCondition(
    (cmd) => cmd.player_aura("Artix", "Some Aura", ">=", 1),
    {
      _tag: "PlayerAura",
      player: "Artix",
      aura: "Some Aura",
      operator: "gte",
      value: 1,
    },
  );
  expectRecordedCondition((cmd) => cmd.target_hp("<", 5000), {
    _tag: "TargetHp",
    operator: "lt",
    value: 5000,
  });
  expectRecordedCondition((cmd) => cmd.monster_hp("Ultra Boss", "<=", 100000), {
    _tag: "MonsterMetric",
    metric: "monster_health",
    target: "Ultra Boss",
    operator: "lte",
    value: 100000,
  });
  expectRecordedCondition(
    (cmd) => cmd.monster_hp_percentage("Ultra Boss", "<=", 25),
    {
      _tag: "MonsterMetric",
      metric: "monster_health_percent",
      target: "Ultra Boss",
      operator: "lte",
      value: 25,
    },
  );
});

test("rejects invalid comparison argument order and word operators", () => {
  const { cmd } = createRecordedCommandMap();

  expect(() => cmd.hp("above", 1000)).toThrow(
    "cmd.hp: comparison must be provided as (operator, value)",
  );
  expect(() => cmd.hp(1000, "<")).toThrow(
    "cmd.hp: comparison must be provided as (operator, value)",
  );
});

test("records can-buy item quantity conditions", () => {
  expectRecordedCondition((cmd) => cmd.can_buy_item("Potion", 5), {
    _tag: "ItemState",
    item: "Potion",
    quantity: 5,
    state: "can_buy",
    expected: true,
  });
});

test("evaluates can-buy item quantity conditions", async () => {
  const { cmd } = createRecordedCommandMap();
  const context = {
    sourceName: "conditions.test.ts",
    shops: {
      canBuyItem: (item: ItemIdentifierToken, quantity?: number) =>
        Effect.succeed(item === "Potion" && quantity === 5),
    },
    run: (effect: Effect.Effect<unknown, unknown>) => effect,
  } as unknown as ScriptExecutionContext;

  await expect(
    Effect.runPromise(
      evaluateScriptCondition(context, "if", cmd.can_buy_item("Potion", 5)),
    ),
  ).resolves.toBe(true);
});

test("evaluates class rank conditions", async () => {
  const { cmd } = createRecordedCommandMap();
  const context = {
    sourceName: "conditions.test.ts",
    inventory: {
      getItem: (item: ItemIdentifierToken) =>
        Effect.succeed(item === "ArchPaladin" ? { classRank: 10 } : null),
    },
    run: (effect: Effect.Effect<unknown, unknown>) => effect,
  } as unknown as ScriptExecutionContext;

  await expect(
    Effect.runPromise(
      evaluateScriptCondition(
        context,
        "if",
        cmd.class_rank("ArchPaladin", ">=", 10),
      ),
    ),
  ).resolves.toBe(true);
  await expect(
    Effect.runPromise(
      evaluateScriptCondition(
        context,
        "if",
        cmd.class_rank("Missing Class", ">", 0),
      ),
    ),
  ).resolves.toBe(false);
});

test("evaluates self metric conditions through PlayerMetric", async () => {
  const { cmd } = createRecordedCommandMap();
  const context = createMetricContext({
    hp: 500,
    maxHp: 1000,
    mp: 40,
    maxMp: 100,
  });

  await expect(
    Effect.runPromise(evaluateScriptCondition(context, "if", cmd.hp("<", 600))),
  ).resolves.toBe(true);
  await expect(
    Effect.runPromise(evaluateScriptCondition(context, "if", cmd.mp(">=", 50))),
  ).resolves.toBe(false);
  await expect(
    Effect.runPromise(
      evaluateScriptCondition(context, "if", cmd.hp_percentage("=", 50)),
    ),
  ).resolves.toBe(true);
  await expect(
    Effect.runPromise(
      evaluateScriptCondition(context, "if", cmd.mp_percentage("<", 30)),
    ),
  ).resolves.toBe(false);
});

test("does not expose legacy numeric condition names", () => {
  const commandNames = Object.keys(createScriptDsl(() => {}));
  const handlerNames = scriptCommandHandlers.map(([name]) => name);
  const removedNames = [
    "hp_percent",
    "mp_percent",
    "monster_health",
    "monster_health_percent",
    "faction_rank_greater_than",
    "faction_rank_less_than",
    "gold_greater_than",
    "gold_less_than",
    "hp_greater_than",
    "hp_less_than",
    "hp_percentage_greater_than",
    "hp_percentage_less_than",
    "mp_greater_than",
    "mp_less_than",
    "player_aura_greater_than",
    "player_aura_less_than",
    "player_hp_greater_than",
    "player_hp_less_than",
    "player_hp_percentage_greater_than",
    "player_hp_percentage_less_than",
    "any_player_hp_percentage_greater_than",
    "any_player_hp_percentage_less_than",
    "player_count_greater_than",
    "player_count_less_than",
    "target_hp_greater_than",
    "target_hp_less_than",
    "target_hp_between",
    "cell_player_count_greater_than",
    "cell_player_count_less_than",
    "level_is",
    "level_greater_than",
    "level_less_than",
    "monster_hp_greater_than",
    "monster_hp_less_than",
  ];

  expect(commandNames).toContain("hp");
  expect(commandNames).toContain("mp");
  expect(commandNames).toContain("hp_percentage");
  expect(commandNames).toContain("mp_percentage");
  expect(commandNames).toContain("gold");
  expect(commandNames).toContain("level");
  expect(commandNames).toContain("faction_rank");
  expect(commandNames).toContain("class_rank");
  expect(commandNames).toContain("player_hp");
  expect(commandNames).toContain("player_hp_percentage");
  expect(commandNames).toContain("any_player_hp_percentage");
  expect(commandNames).toContain("player_count");
  expect(commandNames).toContain("cell_player_count");
  expect(commandNames).toContain("player_aura");
  expect(commandNames).toContain("target_hp");
  expect(commandNames).toContain("monster_hp");
  expect(commandNames).toContain("monster_hp_percentage");

  for (const name of removedNames) {
    expect(commandNames).not.toContain(name);
    expect(handlerNames).not.toContain(name);
  }
});
