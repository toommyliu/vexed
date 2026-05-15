import { Effect } from "effect";
import type { CombatKillOptions } from "../../flash/Services/Combat";
import { ScriptInvalidArgumentError } from "../Errors";
import {
  ScriptCommandResult,
  type ScriptCommandError,
  type ScriptCommandHandler,
} from "../Types";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  readOptionalInstructionBoolean,
  readOptionalInstructionObject,
  readOptionalInstructionString,
  readOptionalScriptArgumentBoolean,
  readOptionalScriptArgumentObject,
  readOptionalScriptArgumentString,
  requireInstructionIdentifier,
  requireInstructionNumber,
  requireInstructionString,
  requireScriptArgumentIdentifier,
  requireScriptArgumentNumber,
  requireScriptArgumentString,
  type ScriptCommandDsl,
  type ScriptInstructionRecorder,
} from "./commandDsl";
import { createCustomScriptRuntimeApi } from "./customCommand";

interface ArmySyncOptions {
  readonly timeoutMs?: number;
}

interface ArmyEquipSetOptions {
  readonly resolveItems?: boolean;
}

type ArmyScriptCommandArguments = {
  army_start: [configName: string];
  army_sync: [label?: string, options?: ArmySyncOptions];
  army_join: [map: string, cell?: string, pad?: string];
  army_kill: [target: string, options?: Partial<CombatKillOptions>];
  army_kill_for: [
    target: string,
    item: string | number,
    quantity: number,
    isTemp: boolean,
    options?: Partial<CombatKillOptions>,
  ];
  army_kill_for_item: [
    target: string,
    item: string | number,
    quantity: number,
    options?: Partial<CombatKillOptions>,
  ];
  army_kill_for_tempitem: [
    target: string,
    item: string | number,
    quantity: number,
    options?: Partial<CombatKillOptions>,
  ];
  execute_with_army: [
    fn: (api?: ReturnType<typeof createCustomScriptRuntimeApi>) => unknown,
    fnName?: string,
  ];
  army_equip_set: [setName: string, options?: ArmyEquipSetOptions];
};

type ArmyScriptDsl = ScriptCommandDsl<ArmyScriptCommandArguments>;
const armyCommandDomain = defineScriptCommandDomain<ArmyScriptCommandArguments>();

const normalizeQuantity = (quantity: number): number =>
  Math.max(1, Math.floor(quantity));

const armyStartCommand: ScriptCommandHandler = (context, instruction) =>
  Effect.gen(function* () {
    const configName = yield* requireInstructionString(
      context,
      "army_start",
      instruction.args,
      0,
      "configName",
    );

    yield* context.army.start(configName);
    yield* context.setScriptCleanup(
      "army-session",
      context.army.leave().pipe(Effect.catchCause(() => Effect.void)),
    );
    return ScriptCommandResult.Continue;
  });

const armySyncCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const label = yield* readOptionalInstructionString(
      context,
      "army_sync",
      args,
      0,
      "label",
    );
    const options = yield* readOptionalInstructionObject<ArmySyncOptions>(
      context,
      "army_sync",
      args,
      1,
      "options",
    );

    yield* context.army.sync(label, options);
  }),
);

const armyJoinCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const map = yield* requireInstructionString(
      context,
      "army_join",
      args,
      0,
      "map",
    );
    const cell = yield* readOptionalInstructionString(
      context,
      "army_join",
      args,
      1,
      "cell",
    );
    const pad = yield* readOptionalInstructionString(
      context,
      "army_join",
      args,
      2,
      "pad",
    );

    yield* context.army.joinMap(map, cell, pad);
  }),
);

const armyKillCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const target = yield* requireInstructionString(
      context,
      "army_kill",
      args,
      0,
      "target",
    );
    const options = yield* readOptionalInstructionObject<CombatKillOptions>(
      context,
      "army_kill",
      args,
      1,
      "options",
    );

    yield* context.army.kill(target, options);
  }),
);

const armyKillForCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const target = yield* requireInstructionString(
      context,
      "army_kill_for",
      args,
      0,
      "target",
    );
    const item = yield* requireInstructionIdentifier(
      context,
      "army_kill_for",
      args,
      1,
      "item",
    );
    const quantity = yield* requireInstructionNumber(
      context,
      "army_kill_for",
      args,
      2,
      "quantity",
    );
    const isTemp = yield* readOptionalInstructionBoolean(
      context,
      "army_kill_for",
      args,
      3,
      "isTemp",
    );
    const options = yield* readOptionalInstructionObject<CombatKillOptions>(
      context,
      "army_kill_for",
      args,
      4,
      "options",
    );

    if (isTemp === undefined) {
      return yield* new ScriptInvalidArgumentError({
        sourceName: context.sourceName,
        command: "army_kill_for",
        message: "isTemp must be a boolean",
      });
    }

    yield* context.army.killForItem(
      target,
      item,
      normalizeQuantity(quantity),
      isTemp,
      options,
    );
  }),
);

const armyKillForItemCommand = (isTemp: boolean): ScriptCommandHandler =>
  createCommandHandler((context, args) =>
    Effect.gen(function* () {
      const command = isTemp ? "army_kill_for_tempitem" : "army_kill_for_item";
      const target = yield* requireInstructionString(
        context,
        command,
        args,
        0,
        "target",
      );
      const item = yield* requireInstructionIdentifier(
        context,
        command,
        args,
        1,
        "item",
      );
      const quantity = yield* requireInstructionNumber(
        context,
        command,
        args,
        2,
        "quantity",
      );
      const options = yield* readOptionalInstructionObject<CombatKillOptions>(
        context,
        command,
        args,
        3,
        "options",
      );

      yield* context.army.killForItem(
        target,
        item,
        normalizeQuantity(quantity),
        isTemp,
        options,
      );
    }),
  );

const executeWithArmyCommand: ScriptCommandHandler = (context, instruction) => {
  const fn = instruction.args[0];
  if (typeof fn !== "function") {
    return Effect.fail(
      new ScriptInvalidArgumentError({
        sourceName: context.sourceName,
        command: "execute_with_army",
        message: "fn must be a function",
      }),
    );
  }

  const action = Effect.promise(async () => {
    await fn(createCustomScriptRuntimeApi(context));
  }) as Effect.Effect<void, never, never>;

  return context.army
    .executeWithArmy(action)
    .pipe(Effect.as(ScriptCommandResult.Continue)) as Effect.Effect<
    typeof ScriptCommandResult.Continue,
    ScriptCommandError
  >;
};

const armyEquipSetCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const setName = yield* requireInstructionString(
      context,
      "army_equip_set",
      args,
      0,
      "setName",
    );
    const options = yield* readOptionalInstructionObject<ArmyEquipSetOptions>(
      context,
      "army_equip_set",
      args,
      1,
      "options",
    );

    yield* context.army.equipSet(setName, options);
  }),
);

const armyCommandHandlerMap = armyCommandDomain.defineHandlers({
  army_start: armyStartCommand,
  army_sync: armySyncCommand,
  army_join: armyJoinCommand,
  army_kill: armyKillCommand,
  army_kill_for: armyKillForCommand,
  army_kill_for_item: armyKillForItemCommand(false),
  army_kill_for_tempitem: armyKillForItemCommand(true),
  execute_with_army: executeWithArmyCommand,
  army_equip_set: armyEquipSetCommand,
});

export const armyCommandHandlers = armyCommandDomain.handlerEntries(
  armyCommandHandlerMap,
);

export const createArmyScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): ArmyScriptDsl => {
  const recordArmyInstruction =
    armyCommandDomain.createInstructionRecorder(recordInstruction);

  return {
    army_start(configName) {
      recordArmyInstruction(
        "army_start",
        requireScriptArgumentString("army_start", "configName", configName),
      );
    },
    army_sync(label, options) {
      recordArmyInstruction(
        "army_sync",
        readOptionalScriptArgumentString("army_sync", "label", label),
        readOptionalScriptArgumentObject<ArmySyncOptions>(
          "army_sync",
          "options",
          options,
        ),
      );
    },
    army_join(map, cell, pad) {
      recordArmyInstruction(
        "army_join",
        requireScriptArgumentString("army_join", "map", map),
        readOptionalScriptArgumentString("army_join", "cell", cell),
        readOptionalScriptArgumentString("army_join", "pad", pad),
      );
    },
    army_kill(target, options) {
      recordArmyInstruction(
        "army_kill",
        requireScriptArgumentString("army_kill", "target", target),
        readOptionalScriptArgumentObject<CombatKillOptions>(
          "army_kill",
          "options",
          options,
        ),
      );
    },
    army_kill_for(target, item, quantity, isTemp, options) {
      recordArmyInstruction(
        "army_kill_for",
        requireScriptArgumentString("army_kill_for", "target", target),
        requireScriptArgumentIdentifier("army_kill_for", "item", item),
        normalizeQuantity(
          requireScriptArgumentNumber("army_kill_for", "quantity", quantity),
        ),
        readOptionalScriptArgumentBoolean("army_kill_for", "isTemp", isTemp) ??
          false,
        readOptionalScriptArgumentObject<CombatKillOptions>(
          "army_kill_for",
          "options",
          options,
        ),
      );
    },
    army_kill_for_item(target, item, quantity, options) {
      recordArmyInstruction(
        "army_kill_for_item",
        requireScriptArgumentString("army_kill_for_item", "target", target),
        requireScriptArgumentIdentifier("army_kill_for_item", "item", item),
        normalizeQuantity(
          requireScriptArgumentNumber(
            "army_kill_for_item",
            "quantity",
            quantity,
          ),
        ),
        readOptionalScriptArgumentObject<CombatKillOptions>(
          "army_kill_for_item",
          "options",
          options,
        ),
      );
    },
    army_kill_for_tempitem(target, item, quantity, options) {
      recordArmyInstruction(
        "army_kill_for_tempitem",
        requireScriptArgumentString("army_kill_for_tempitem", "target", target),
        requireScriptArgumentIdentifier("army_kill_for_tempitem", "item", item),
        normalizeQuantity(
          requireScriptArgumentNumber(
            "army_kill_for_tempitem",
            "quantity",
            quantity,
          ),
        ),
        readOptionalScriptArgumentObject<CombatKillOptions>(
          "army_kill_for_tempitem",
          "options",
          options,
        ),
      );
    },
    execute_with_army(fn, fnName) {
      if (typeof fn !== "function") {
        throw new Error("cmd.execute_with_army: fn must be a function");
      }

      recordArmyInstruction(
        "execute_with_army",
        fn,
        readOptionalScriptArgumentString("execute_with_army", "fnName", fnName),
      );
    },
    army_equip_set(setName, options) {
      recordArmyInstruction(
        "army_equip_set",
        requireScriptArgumentString("army_equip_set", "setName", setName),
        readOptionalScriptArgumentObject<ArmyEquipSetOptions>(
          "army_equip_set",
          "options",
          options,
        ),
      );
    },
  };
};
