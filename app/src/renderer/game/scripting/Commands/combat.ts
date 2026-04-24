import { Effect } from "effect";
import type { CombatKillOptions } from "../../flash/Services/Combat";
import { ScriptInvalidArgumentError } from "../Errors";
import type { ScriptCommandHandler, ScriptExecutionContext } from "../Types";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  requireScriptArgumentIdentifier,
  requireScriptArgumentNumber,
  requireScriptArgumentString,
  requireInstructionIdentifier,
  requireInstructionNumber,
  requireInstructionString,
  readOptionalScriptArgumentBoolean,
  readOptionalScriptArgumentObject,
  readOptionalInstructionBoolean,
  readOptionalInstructionObject,
  type ScriptCommandDsl,
  type ScriptInstructionRecorder,
} from "./commandDsl";

const DEFAULT_BUFF_SKILLS = [1, 2, 3] as const;

type CombatScriptCommandArguments = {
  attack: [target: string];
  cancel_target: [];
  exit_combat: [];
  kill: [target: string, options?: Partial<CombatKillOptions>];
  kill_for_item: [
    target: string,
    item: string | number,
    quantity: number,
    options?: Partial<CombatKillOptions>,
  ];
  kill_for_tempitem: [
    target: string,
    item: string | number,
    quantity: number,
    options?: Partial<CombatKillOptions>,
  ];
  rest: [full?: boolean];
  use_skill: [skill: number | string, wait?: boolean];
  force_use_skill: [skill: number | string, wait?: boolean];
  hunt: [target: string, most?: boolean];
  buff: [skillList?: ReadonlyArray<number> | null, wait?: boolean];
};

type CombatScriptDsl = ScriptCommandDsl<CombatScriptCommandArguments>;
const combatCommandDomain =
  defineScriptCommandDomain<CombatScriptCommandArguments>();

const readOptionalInstructionBuffSkillList = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) =>
  Effect.gen(function* () {
    const value = args[index];
    if (value === undefined || value === null) {
      return value;
    }

    if (!Array.isArray(value)) {
      return yield* Effect.fail(
        new ScriptInvalidArgumentError({
          sourceName: context.sourceName,
          command,
          message: `${argName} must be an array of numbers`,
        }),
      );
    }

    const normalizedSkills: number[] = [];
    for (const [skillIndex] of value.entries()) {
      const skill = yield* requireInstructionNumber(
        context,
        command,
        value,
        skillIndex,
        `${argName}[${skillIndex}]`,
      );
      normalizedSkills.push(Math.trunc(skill));
    }

    return normalizedSkills;
  });

const readOptionalScriptArgumentBuffSkillList = (
  command: string,
  argName: string,
  value: unknown,
): ReadonlyArray<number> | null | undefined => {
  if (value === undefined || value === null) {
    return value;
  }

  if (!Array.isArray(value)) {
    throw new Error(`cmd.${command}: ${argName} must be an array of numbers`);
  }

  return value.map((skill, index) =>
    Math.trunc(
      requireScriptArgumentNumber(command, `${argName}[${index}]`, skill),
    ),
  );
};

const attackCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const target = yield* requireInstructionString(
      context,
      "attack",
      args,
      0,
      "target",
    );
    yield* context.run(context.combat.attackMonster(target));
  }),
);

const cancelTargetCommand = createCommandHandler((context) =>
  Effect.gen(function* () {
    yield* context.run(context.combat.cancelAutoAttack());
    yield* context.run(context.combat.cancelTarget());
  }),
);

const exitCombatCommand = createCommandHandler((context) =>
  context.run(context.combat.exit()).pipe(Effect.asVoid),
);

const killCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const target = yield* requireInstructionString(
      context,
      "kill",
      args,
      0,
      "target",
    );
    const options = yield* readOptionalInstructionObject<CombatKillOptions>(
      context,
      "kill",
      args,
      1,
      "options",
    );

    if (options === undefined) {
      yield* context.run(context.combat.kill(target));
      return;
    }

    yield* context.run(context.combat.kill(target, options));
  }),
);

const killForItemCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const target = yield* requireInstructionString(
      context,
      "kill_for_item",
      args,
      0,
      "target",
    );
    const item = yield* requireInstructionIdentifier(
      context,
      "kill_for_item",
      args,
      1,
      "item",
    );
    const quantity = yield* requireInstructionNumber(
      context,
      "kill_for_item",
      args,
      2,
      "quantity",
    );
    const options = yield* readOptionalInstructionObject<CombatKillOptions>(
      context,
      "kill_for_item",
      args,
      3,
      "options",
    );

    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    if (options === undefined) {
      yield* context.run(
        context.combat.killForItem(target, item, normalizedQuantity),
      );
      return;
    }

    yield* context.run(
      context.combat.killForItem(target, item, normalizedQuantity, options),
    );
  }),
);

const killForTempItemCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const target = yield* requireInstructionString(
      context,
      "kill_for_tempitem",
      args,
      0,
      "target",
    );
    const item = yield* requireInstructionIdentifier(
      context,
      "kill_for_tempitem",
      args,
      1,
      "item",
    );
    const quantity = yield* requireInstructionNumber(
      context,
      "kill_for_tempitem",
      args,
      2,
      "quantity",
    );
    const options = yield* readOptionalInstructionObject<CombatKillOptions>(
      context,
      "kill_for_tempitem",
      args,
      3,
      "options",
    );

    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    if (options === undefined) {
      yield* context.run(
        context.combat.killForTempItem(target, item, normalizedQuantity),
      );
      return;
    }

    yield* context.run(
      context.combat.killForTempItem(target, item, normalizedQuantity, options),
    );
  }),
);

const restCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const full = yield* readOptionalInstructionBoolean(
      context,
      "rest",
      args,
      0,
      "full",
    );
    yield* context.run(context.combat.exit()).pipe(Effect.asVoid);
    yield* context.run(context.player.rest(full ?? false));
  }),
);

const useSkillCommand = (force: boolean): ScriptCommandHandler =>
  createCommandHandler((context, args) =>
    Effect.gen(function* () {
      const skill = yield* requireInstructionIdentifier(
        context,
        force ? "force_use_skill" : "use_skill",
        args,
        0,
        "skill",
      );
      const wait = yield* readOptionalInstructionBoolean(
        context,
        force ? "force_use_skill" : "use_skill",
        args,
        1,
        "wait",
      );

      yield* context.run(context.combat.useSkill(skill, force, wait ?? false));
    }),
  );

const huntCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const target = yield* requireInstructionString(
      context,
      "hunt",
      args,
      0,
      "target",
    );
    const most = yield* readOptionalInstructionBoolean(
      context,
      "hunt",
      args,
      1,
      "most",
    );
    yield* context
      .run(context.combat.hunt(target, most ?? false))
      .pipe(Effect.asVoid);
  }),
);

const buffCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const skillList = yield* readOptionalInstructionBuffSkillList(
      context,
      "buff",
      args,
      0,
      "skill_list",
    );
    const wait = yield* readOptionalInstructionBoolean(
      context,
      "buff",
      args,
      1,
      "wait",
    );
    const normalizedSkills =
      skillList === undefined || skillList === null || skillList.length === 0
        ? DEFAULT_BUFF_SKILLS
        : skillList;

    yield* Effect.forEach(normalizedSkills, (skill) =>
      context
        .run(context.combat.useSkill(skill, true, wait ?? false))
        .pipe(Effect.andThen(Effect.sleep("1 second"))),
    ).pipe(Effect.asVoid);
  }),
);

const combatCommandHandlerMap = combatCommandDomain.defineHandlers({
  attack: attackCommand,
  cancel_target: cancelTargetCommand,
  exit_combat: exitCombatCommand,
  kill: killCommand,
  kill_for_item: killForItemCommand,
  kill_for_tempitem: killForTempItemCommand,
  rest: restCommand,
  use_skill: useSkillCommand(false),
  force_use_skill: useSkillCommand(true),
  hunt: huntCommand,
  buff: buffCommand,
});

export const combatCommandHandlers = combatCommandDomain.handlerEntries(
  combatCommandHandlerMap,
);

export const createCombatScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): CombatScriptDsl => {
  const recordCombatInstruction =
    combatCommandDomain.createInstructionRecorder(recordInstruction);

  return {
    /**
     * Attacks a target.
     *
     * @param target Monster name or target token.
     */
    attack(target: string) {
      recordCombatInstruction(
        "attack",
        requireScriptArgumentString("attack", "target", target),
      );
    },

    /**
     * Clears the current target.
     */
    cancel_target() {
      recordCombatInstruction("cancel_target");
    },

    /**
     * Exits the player from combat.
     */
    exit_combat() {
      recordCombatInstruction("exit_combat");
    },

    /**
     * Kills a target.
     *
     * @param target Monster name or identifier.
     * @param options Optional kill settings.
     */
    kill(target: string, options?: Partial<CombatKillOptions>) {
      recordCombatInstruction(
        "kill",
        requireScriptArgumentString("kill", "target", target),
        readOptionalScriptArgumentObject<CombatKillOptions>(
          "kill",
          "options",
          options,
        ),
      );
    },

    /**
     * Kills a target until an inventory item reaches the requested quantity.
     *
     * @param target Monster name or identifier.
     * @param item Item name or item id.
     * @param quantity Quantity to reach.
     * @param options Optional kill settings.
     * @example cmd.kill_for_item("Slime", "Slime Goo", 10)
     */
    kill_for_item(
      target: string,
      item: string | number,
      quantity: number,
      options?: Partial<CombatKillOptions>,
    ) {
      recordCombatInstruction(
        "kill_for_item",
        requireScriptArgumentString("kill_for_item", "target", target),
        requireScriptArgumentIdentifier("kill_for_item", "item", item),
        Math.max(
          1,
          Math.floor(
            requireScriptArgumentNumber("kill_for_item", "quantity", quantity),
          ),
        ),
        readOptionalScriptArgumentObject<CombatKillOptions>(
          "kill_for_item",
          "options",
          options,
        ),
      );
    },

    /**
     * Kills a target until a temporary item reaches the requested quantity.
     *
     * @param target Monster name or identifier.
     * @param item Item name or item id.
     * @param quantity Quantity to reach.
     * @param options Optional kill settings.
     */
    kill_for_tempitem(
      target: string,
      item: string | number,
      quantity: number,
      options?: Partial<CombatKillOptions>,
    ) {
      recordCombatInstruction(
        "kill_for_tempitem",
        requireScriptArgumentString("kill_for_tempitem", "target", target),
        requireScriptArgumentIdentifier("kill_for_tempitem", "item", item),
        Math.max(
          1,
          Math.floor(
            requireScriptArgumentNumber(
              "kill_for_tempitem",
              "quantity",
              quantity,
            ),
          ),
        ),
        readOptionalScriptArgumentObject<CombatKillOptions>(
          "kill_for_tempitem",
          "options",
          options,
        ),
      );
    },

    /**
     * Rests the player.
     *
     * @param full Whether to rest fully.
     */
    rest(full: boolean = false) {
      recordCombatInstruction(
        "rest",
        readOptionalScriptArgumentBoolean("rest", "full", full) ?? false,
      );
    },

    /**
     * Uses a skill.
     *
     * @param skill Skill slot.
     * @param wait Whether to wait for the skill.
     */
    use_skill(skill: number | string, wait: boolean = false) {
      recordCombatInstruction(
        "use_skill",
        requireScriptArgumentIdentifier("use_skill", "skill", skill),
        readOptionalScriptArgumentBoolean("use_skill", "wait", wait) ?? false,
      );
    },

    /**
     * Uses a skill even without a target.
     *
     * @param skill Skill slot.
     * @param wait Whether to wait for the skill.
     */
    force_use_skill(skill: number | string, wait: boolean = false) {
      recordCombatInstruction(
        "force_use_skill",
        requireScriptArgumentIdentifier("force_use_skill", "skill", skill),
        readOptionalScriptArgumentBoolean("force_use_skill", "wait", wait) ??
          false,
      );
    },

    /**
     * Jumps to the cell where a monster target can be found.
     *
     * @param target Monster name or identifier.
     * @param most Whether to prefer the cell with the most matching monsters.
     */
    hunt(target: string, most: boolean = false) {
      recordCombatInstruction(
        "hunt",
        requireScriptArgumentString("hunt", "target", target),
        readOptionalScriptArgumentBoolean("hunt", "most", most) ?? false,
      );
    },

    /**
     * Casts a short buff rotation.
     *
     * @param skillList Optional skill list. Pass `null` or `[]` to use the default `[1, 2, 3]`.
     * @param wait Whether to wait for each skill cooldown before casting.
     */
    buff(skillList?: ReadonlyArray<number> | null, wait: boolean = false) {
      recordCombatInstruction(
        "buff",
        readOptionalScriptArgumentBuffSkillList("buff", "skillList", skillList),
        readOptionalScriptArgumentBoolean("buff", "wait", wait) ?? false,
      );
    },
  };
};
