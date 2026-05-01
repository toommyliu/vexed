import { Effect, Number as EffectNumber } from "effect";
import type { AutoZoneSupportedMap } from "../../flash/Services/AutoZone";
import { waitFor } from "../../utils/waitFor";
import { ScriptInvalidArgumentError } from "../Errors";
import { ScriptCommandResult, type ScriptCommandHandler } from "../Types";
import type {
  CustomCommandHandler,
  CustomConditionHandler,
  ScriptPacketHandler,
} from "../Types";
import { makeScriptCancellationError } from "../scriptAsyncScope";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  readOptionalInstructionBoolean,
  readOptionalInstructionString,
  readOptionalScriptArgumentBoolean,
  readOptionalScriptArgumentString,
  requireInstructionNumber,
  requireInstructionString,
  requireScriptArgumentNumber,
  requireScriptArgumentString,
  type ScriptCommandAliasMap,
  type ScriptCommandDsl,
  type ScriptCommandDslWithAliases,
  type ScriptInstructionRecorder,
  withScriptCommandAliases,
} from "./commandDsl";
import {
  assertValidCustomCommandName,
  validateCustomCommandName,
} from "./customCommand";
import { loadShopById } from "./itemOperations";

type PacketHandlerType = "packetFromClient" | "packetFromServer" | "pext";

type MiscScriptCommandArguments = {
  delay: [ms: number];
  log: [message: string];
  logout: [];
  set_delay: [ms: number];
  set_fps: [fps: number];
  enable_collisions: [];
  disable_collisions: [];
  enable_fx: [];
  disable_fx: [];
  show_death_ads: [];
  hide_death_ads: [];
  enable_enemymagnet: [];
  disable_enemymagnet: [];
  enable_infiniterange: [];
  disable_infiniterange: [];
  enable_lagkiller: [];
  disable_lagkiller: [];
  enable_provokecell: [];
  disable_provokecell: [];
  enable_skipcutscenes: [];
  disable_skipcutscenes: [];
  enable_hideplayers: [];
  disable_hideplayers: [];
  set_walk_speed: [speed: number];
  wait_for_player_count: [count: number, exact?: boolean];
  set_name: [name: string];
  set_guild: [guild: string];
  buy_lifesteal: [quantity: number];
  buy_scroll_of_enrage: [quantity: number];
  register_handler: [
    type: PacketHandlerType,
    name: string,
    handler: ScriptPacketHandler,
  ];
  unregister_handler: [type: PacketHandlerType, name: string];
  register_command: [name: string, handler: CustomCommandHandler];
  unregister_command: [name: string];
  register_condition: [name: string, handler: CustomConditionHandler];
  unregister_condition: [name: string];
  use_autozone_ledgermayne: [];
  use_autozone_moreskulls: [];
  use_autozone_darkcarnax: [];
  use_autozone_ultradage: [];
  use_autozone_astralshrine: [];
  use_autozone_queeniona: [];
  use_autozone_magnumopus: [];
  close_window: [];
  beep: [times?: number];
  register_task: [name: string, taskFn: () => void | Promise<void>];
  unregister_task: [name: string];
  drink_consumables: [
    items: string | ReadonlyArray<string>,
    equipAfter?: string,
  ];
  do_wheelofdoom: [toBank?: boolean];
  label: [label: string];
  goto_label: [label: string];
  stop: [];
};

const miscCommandAliases = {
  stop_bot: "stop",
} as const satisfies ScriptCommandAliasMap<MiscScriptCommandArguments>;

type MiscScriptDsl = ScriptCommandDslWithAliases<
  MiscScriptCommandArguments,
  typeof miscCommandAliases
>;
const miscCommandDomain =
  defineScriptCommandDomain<MiscScriptCommandArguments>();

const delayCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const ms = yield* requireInstructionNumber(context, "delay", args, 0, "ms");
    yield* Effect.sleep(`${Math.max(0, Math.floor(ms))} millis`);
  }),
);

const logCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const message = yield* requireInstructionString(
      context,
      "log",
      args,
      0,
      "message",
    );
    yield* Effect.sync(() => {
      console.info(`[script:${context.sourceName}] ${message}`);
    });
  }),
);

const setDelayCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const ms = yield* requireInstructionNumber(
      context,
      "set_delay",
      args,
      0,
      "ms",
    );
    yield* context.setCommandDelay(ms);
  }),
);

const setFpsCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const fps = yield* requireInstructionNumber(
      context,
      "set_fps",
      args,
      0,
      "fps",
    );
    yield* context.run(
      context.settings.setFrameRate(Math.max(1, Math.floor(fps))),
    );
  }),
);

const settingCommand = (
  f: Parameters<typeof createCommandHandler>[0],
): ScriptCommandHandler => createCommandHandler(f);

const waitForPlayerCountCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const count = Math.max(
      0,
      Math.floor(
        yield* requireInstructionNumber(
          context,
          "wait_for_player_count",
          args,
          0,
          "count",
        ),
      ),
    );
    const exact = yield* readOptionalInstructionBoolean(
      context,
      "wait_for_player_count",
      args,
      1,
      "exact",
    );

    yield* waitFor(
      Effect.map(context.world.players.getAll(), (players) =>
        exact ? players.size === count : players.size >= count,
      ),
      { timeout: "30 seconds" },
    );
  }),
);

const buyLifeStealCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const quantity = EffectNumber.clamp(
      Math.floor(
        yield* requireInstructionNumber(
          context,
          "buy_lifesteal",
          args,
          0,
          "quantity",
        ),
      ),
      { minimum: 1, maximum: 99 },
    );
    const itemName = "Scroll of Life Steal";
    const current = yield* context.run(context.inventory.getItem(itemName));
    const needed = quantity - (current?.quantity ?? 0);
    if (needed <= 0) {
      return;
    }

    yield* context.run(context.player.joinMap("arcangrove", "Potion", "Right"));
    yield* loadShopById(context, 211);
    yield* context.run(context.shops.buyByName(itemName, needed));
  }),
);

const buyScrollOfEnrageCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const quantity = EffectNumber.clamp(
      Math.floor(
        yield* requireInstructionNumber(
          context,
          "buy_scroll_of_enrage",
          args,
          0,
          "quantity",
        ),
      ),
      { minimum: 1, maximum: 1_000 },
    );
    const itemName = "Scroll of Enrage";
    if (yield* context.run(context.inventory.contains(itemName, quantity))) {
      return;
    }

    yield* context.run(
      context.bank.withdrawMany(
        "Gold Voucher 100k",
        "Arcane Quill",
        "Zealous Ink",
      ),
    );
    yield* context.run(context.player.joinMap("spellcraft"));
    yield* loadShopById(context, 693);

    while (
      !(yield* context.run(context.inventory.contains(itemName, quantity)))
    ) {
      if (yield* context.run(context.drops.containsDrop(itemName))) {
        yield* context.run(context.drops.acceptDrop(itemName));
      }

      yield* context.run(context.quests.accept(2330, true));

      if (
        !(yield* context.run(
          context.inventory.contains("Gold Voucher 100k", 1),
        ))
      ) {
        if ((yield* context.run(context.player.getGold())) < 100_000) {
          return;
        }
        yield* context.run(context.shops.buyByName("Gold Voucher 100k", 1));
      }

      if (
        !(yield* context.run(context.inventory.contains("Arcane Quill", 1)))
      ) {
        if ((yield* context.run(context.player.getGold())) < 100_000) {
          return;
        }
        yield* context.run(context.shops.buyByName("Arcane Quill", 1));
      }

      if (!(yield* context.run(context.inventory.contains("Zealous Ink", 5)))) {
        if (
          !(yield* context.run(context.inventory.contains("Arcane Quill", 1)))
        ) {
          return;
        }
        yield* context.run(context.shops.buyByName("Zealous Ink", 5));
      }

      if (!(yield* context.run(context.quests.canComplete(2330)))) {
        return;
      }
      yield* context.run(context.quests.complete(2330, 5));
    }
  }),
);

const registerHandlerCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const type = yield* requireInstructionString(
      context,
      "register_handler",
      args,
      0,
      "type",
    );
    const name = yield* requireInstructionString(
      context,
      "register_handler",
      args,
      1,
      "name",
    );
    const handler = args[2];
    if (
      type !== "packetFromClient" &&
      type !== "packetFromServer" &&
      type !== "pext"
    ) {
      return;
    }

    if (typeof handler !== "function") {
      return;
    }

    yield* context.registerPacketHandler(
      type,
      name,
      handler as ScriptPacketHandler,
    );
  }),
);

const unregisterHandlerCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const type = yield* requireInstructionString(
      context,
      "unregister_handler",
      args,
      0,
      "type",
    );
    const name = yield* requireInstructionString(
      context,
      "unregister_handler",
      args,
      1,
      "name",
    );
    if (
      type !== "packetFromClient" &&
      type !== "packetFromServer" &&
      type !== "pext"
    ) {
      return;
    }

    yield* context.unregisterPacketHandler(type, name);
  }),
);

const registerCommandCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const name = yield* requireInstructionString(
      context,
      "register_command",
      args,
      0,
      "name",
    );
    const normalizedName = yield* validateCustomCommandName(
      context,
      "register_command",
      name,
    );
    const handler = args[1];
    if (typeof handler !== "function") {
      return yield* new ScriptInvalidArgumentError({
        sourceName: context.sourceName,
        command: "register_command",
        message: "handler must be a function",
      });
    }

    yield* context.registerCustomCommand(
      normalizedName,
      handler as CustomCommandHandler,
    );
  }),
);

const unregisterCommandCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const name = yield* requireInstructionString(
      context,
      "unregister_command",
      args,
      0,
      "name",
    );
    const normalizedName = yield* validateCustomCommandName(
      context,
      "unregister_command",
      name,
    );
    yield* context.unregisterCustomCommand(normalizedName);
  }),
);

const registerConditionCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const name = yield* requireInstructionString(
      context,
      "register_condition",
      args,
      0,
      "name",
    );
    const normalizedName = yield* validateCustomCommandName(
      context,
      "register_condition",
      name,
    );
    const handler = args[1];
    if (typeof handler !== "function") {
      return yield* new ScriptInvalidArgumentError({
        sourceName: context.sourceName,
        command: "register_condition",
        message: "handler must be a function",
      });
    }

    yield* context.registerCustomCondition(
      normalizedName,
      handler as CustomConditionHandler,
    );
  }),
);

const unregisterConditionCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const name = yield* requireInstructionString(
      context,
      "unregister_condition",
      args,
      0,
      "name",
    );
    const normalizedName = yield* validateCustomCommandName(
      context,
      "unregister_condition",
      name,
    );
    yield* context.unregisterCustomCondition(normalizedName);
  }),
);

const autoZoneCommand = (map: AutoZoneSupportedMap) =>
  createCommandHandler((context) =>
    Effect.gen(function* () {
      yield* context.autoZone.setMap(map);
      yield* context.autoZone.setEnabled(true);
    }),
  );

const beepCommand = createCommandHandler((_, args) =>
  Effect.sync(() => {
    const times = Math.max(1, Math.floor(Number(args[0] ?? 1)));
    const AudioContextClass = globalThis.AudioContext;
    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    for (let index = 0; index < times; index += 1) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.2;
      oscillator.start(audioContext.currentTime + index * 0.25);
      oscillator.stop(audioContext.currentTime + index * 0.25 + 0.15);
    }
    setTimeout(() => void audioContext.close(), times * 250 + 500);
  }),
);

// TODO: re-consider usefulness

const registerTaskCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const name = yield* requireInstructionString(
      context,
      "register_task",
      args,
      0,
      "name",
    );
    const taskFn = args[1];
    if (typeof taskFn !== "function") {
      return;
    }

    const jobKey = `script/task/${name}`;
    const started = yield* context.jobs.start(
      jobKey,
      Effect.tryPromise({
        try: async (signal) => {
          if (signal.aborted || context.isCancelled()) {
            throw makeScriptCancellationError();
          }

          await (taskFn as () => void | Promise<void>)();
        },
        catch: (cause) => cause,
      }).pipe(Effect.asVoid),
      { replace: false },
    );
    if (started) {
      yield* context.setScriptCleanup(
        `task:${jobKey}`,
        context.jobs.stop(jobKey).pipe(Effect.asVoid),
      );
    }
  }),
);

const unregisterTaskCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const name = yield* requireInstructionString(
      context,
      "unregister_task",
      args,
      0,
      "name",
    );
    const jobKey = `script/task/${name}`;
    yield* context.removeScriptCleanup(`task:${jobKey}`);
    yield* context.jobs.stop(jobKey);
  }),
);

const drinkConsumablesCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const rawItems = args[0];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];
    const equipAfter = yield* readOptionalInstructionString(
      context,
      "drink_consumables",
      args,
      1,
      "equipAfter",
    );

    for (const item of items) {
      if (typeof item !== "string") {
        continue;
      }

      yield* context.run(context.inventory.equip(item));
      yield* context.run(context.combat.useSkill(5, true, true));
      yield* Effect.sleep("1 second");
    }

    if (equipAfter !== undefined) {
      yield* context.run(context.inventory.equip(equipAfter));
    }
  }),
);

const wheelOfDoomCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const toBank = yield* readOptionalInstructionBoolean(
      context,
      "do_wheelofdoom",
      args,
      0,
      "toBank",
    );
    const item = "Gear of Doom";

    if (!(yield* context.run(context.inventory.contains(item, 3)))) {
      yield* context.run(context.bank.open(true));
      if (!(yield* context.run(context.bank.contains(item, 3)))) {
        return;
      }
      yield* context.run(context.bank.withdraw(item));
    }

    yield* context.run(context.player.joinMap("doom"));
    yield* context.run(context.quests.accept(3076, true));
    if (!(yield* context.run(context.quests.canComplete(3076)))) {
      return;
    }
    yield* context.run(context.quests.complete(3076));

    if (toBank === true) {
      yield* context.run(context.bank.open(true));
      yield* context.run(context.bank.deposit(item));
    }
  }),
);

const stopCommand: ScriptCommandHandler = () =>
  Effect.succeed(ScriptCommandResult.Stop);

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

const miscCommandHandlerMap = miscCommandDomain.defineHandlers({
  delay: delayCommand,
  log: logCommand,
  logout: createCommandHandler((context) => context.run(context.auth.logout())),
  set_delay: setDelayCommand,
  set_fps: setFpsCommand,
  enable_collisions: settingCommand((context) =>
    context.run(context.settings.setCollisionsEnabled(true)),
  ),
  disable_collisions: settingCommand((context) =>
    context.run(context.settings.setCollisionsEnabled(false)),
  ),
  enable_fx: settingCommand((context) =>
    context.run(context.settings.setEffectsEnabled(true)),
  ),
  disable_fx: settingCommand((context) =>
    context.run(context.settings.setEffectsEnabled(false)),
  ),
  show_death_ads: settingCommand((context) =>
    context.run(context.settings.setDeathAdsEnabled(true)),
  ),
  hide_death_ads: settingCommand((context) =>
    context.run(context.settings.setDeathAdsEnabled(false)),
  ),
  enable_enemymagnet: settingCommand((context) =>
    context.run(context.settings.setEnemyMagnetEnabled(true)),
  ),
  disable_enemymagnet: settingCommand((context) =>
    context.run(context.settings.setEnemyMagnetEnabled(false)),
  ),
  enable_infiniterange: settingCommand((context) =>
    context.run(context.settings.setInfiniteRangeEnabled(true)),
  ),
  disable_infiniterange: settingCommand((context) =>
    context.run(context.settings.setInfiniteRangeEnabled(false)),
  ),
  enable_lagkiller: settingCommand((context) =>
    context.run(context.settings.setLagKillerEnabled(true)),
  ),
  disable_lagkiller: settingCommand((context) =>
    context.run(context.settings.setLagKillerEnabled(false)),
  ),
  enable_provokecell: settingCommand((context) =>
    context.run(context.settings.setProvokeCellEnabled(true)),
  ),
  disable_provokecell: settingCommand((context) =>
    context.run(context.settings.setProvokeCellEnabled(false)),
  ),
  enable_skipcutscenes: settingCommand((context) =>
    context.run(context.settings.setSkipCutscenesEnabled(true)),
  ),
  disable_skipcutscenes: settingCommand((context) =>
    context.run(context.settings.setSkipCutscenesEnabled(false)),
  ),
  enable_hideplayers: settingCommand((context) =>
    context.run(context.settings.setPlayersVisible(false)),
  ),
  disable_hideplayers: settingCommand((context) =>
    context.run(context.settings.setPlayersVisible(true)),
  ),
  set_walk_speed: createCommandHandler((context, args) =>
    Effect.gen(function* () {
      const speed = yield* requireInstructionNumber(
        context,
        "set_walk_speed",
        args,
        0,
        "speed",
      );
      yield* context.run(context.settings.setWalkSpeed(Math.trunc(speed)));
    }),
  ),
  wait_for_player_count: waitForPlayerCountCommand,
  set_name: createCommandHandler((context, args) =>
    Effect.gen(function* () {
      const name = yield* requireInstructionString(
        context,
        "set_name",
        args,
        0,
        "name",
      );
      yield* context.run(context.settings.setCustomName(name));
    }),
  ),
  set_guild: createCommandHandler((context, args) =>
    Effect.gen(function* () {
      const guild = yield* requireInstructionString(
        context,
        "set_guild",
        args,
        0,
        "guild",
      );
      yield* context.run(context.settings.setCustomGuild(guild));
    }),
  ),
  buy_lifesteal: buyLifeStealCommand,
  buy_scroll_of_enrage: buyScrollOfEnrageCommand,
  register_handler: registerHandlerCommand,
  unregister_handler: unregisterHandlerCommand,
  register_command: registerCommandCommand,
  unregister_command: unregisterCommandCommand,
  register_condition: registerConditionCommand,
  unregister_condition: unregisterConditionCommand,
  use_autozone_ledgermayne: autoZoneCommand("ledgermayne"),
  use_autozone_moreskulls: autoZoneCommand("moreskulls"),
  use_autozone_darkcarnax: autoZoneCommand("darkcarnax"),
  use_autozone_ultradage: autoZoneCommand("ultradage"),
  use_autozone_astralshrine: autoZoneCommand("astralshrine"),
  use_autozone_queeniona: autoZoneCommand("queeniona"),
  use_autozone_magnumopus: autoZoneCommand("magnumopus"),
  close_window: createCommandHandler(() => Effect.sync(() => window.close())),
  beep: beepCommand,
  register_task: registerTaskCommand,
  unregister_task: unregisterTaskCommand,
  drink_consumables: drinkConsumablesCommand,
  do_wheelofdoom: wheelOfDoomCommand,
  label: createCommandHandler((context, args) =>
    requireInstructionString(context, "label", args, 0, "label"),
  ),
  goto_label: gotoLabelCommand,
  stop: stopCommand,
});

export const miscCommandHandlers = miscCommandDomain.handlerEntriesWithAliases(
  miscCommandHandlerMap,
  miscCommandAliases,
);

const positiveNumber = (command: string, argName: string, value: number) =>
  Math.max(1, Math.floor(requireScriptArgumentNumber(command, argName, value)));

const packetHandlerType = (type: PacketHandlerType): PacketHandlerType => {
  if (
    type !== "packetFromClient" &&
    type !== "packetFromServer" &&
    type !== "pext"
  ) {
    throw new Error("cmd.register_handler: type is not supported");
  }

  return type;
};

export const createMiscScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): MiscScriptDsl => {
  const recordMiscInstruction =
    miscCommandDomain.createInstructionRecorder(recordInstruction);

  const commands: ScriptCommandDsl<MiscScriptCommandArguments> = {
    /**
     * Pauses the script for a fixed number of milliseconds.
     *
     * @param ms - Milliseconds to wait.
     * @example
     * cmd.delay(1000)
     */
    delay(ms) {
      recordMiscInstruction(
        "delay",
        Math.max(0, Math.floor(requireScriptArgumentNumber("delay", "ms", ms))),
      );
    },
    /**
     * Logs a script-scoped message to the console.
     *
     * @param message - Message to write to the console.
     * @example
     * cmd.log("quest complete")
     */
    log(message) {
      recordMiscInstruction(
        "log",
        requireScriptArgumentString("log", "message", message),
      );
    },
    /**
     * Logs out of the current game session.
     */
    logout() {
      recordMiscInstruction("logout");
    },
    /**
     * Sets a delay applied after each subsequent command.
     *
     * @param ms - Milliseconds to wait after each command.
     * @example
     * cmd.set_delay(750)
     */
    set_delay(ms) {
      recordMiscInstruction(
        "set_delay",
        Math.max(
          0,
          Math.floor(requireScriptArgumentNumber("set_delay", "ms", ms)),
        ),
      );
    },
    /**
     * Changes the Flash client frame rate.
     *
     * @param fps - Frames per second.
     * @example
     * cmd.set_fps(60)
     */
    set_fps(fps) {
      recordMiscInstruction("set_fps", positiveNumber("set_fps", "fps", fps));
    },
    /**
     * Enables collision checks.
     */
    enable_collisions() {
      recordMiscInstruction("enable_collisions");
    },
    /**
     * Disables collision checks.
     */
    disable_collisions() {
      recordMiscInstruction("disable_collisions");
    },
    /**
     * Shows Flash visual effects.
     */
    enable_fx() {
      recordMiscInstruction("enable_fx");
    },
    /**
     * Hides Flash visual effects.
     */
    disable_fx() {
      recordMiscInstruction("disable_fx");
    },
    /**
     * Shows death ads.
     */
    show_death_ads() {
      recordMiscInstruction("show_death_ads");
    },
    /**
     * Hides death ads.
     */
    hide_death_ads() {
      recordMiscInstruction("hide_death_ads");
    },
    /**
     * Enables enemy magnet.
     */
    enable_enemymagnet() {
      recordMiscInstruction("enable_enemymagnet");
    },
    /**
     * Disables enemy magnet.
     */
    disable_enemymagnet() {
      recordMiscInstruction("disable_enemymagnet");
    },
    /**
     * Enables infinite range.
     */
    enable_infiniterange() {
      recordMiscInstruction("enable_infiniterange");
    },
    /**
     * Disables infinite range.
     */
    disable_infiniterange() {
      recordMiscInstruction("disable_infiniterange");
    },
    /**
     * Enables lag killer.
     */
    enable_lagkiller() {
      recordMiscInstruction("enable_lagkiller");
    },
    /**
     * Disables lag killer.
     */
    disable_lagkiller() {
      recordMiscInstruction("disable_lagkiller");
    },
    /**
     * Enables provoke cell behavior.
     */
    enable_provokecell() {
      recordMiscInstruction("enable_provokecell");
    },
    /**
     * Disables provoke cell behavior.
     */
    disable_provokecell() {
      recordMiscInstruction("disable_provokecell");
    },
    /**
     * Enables cutscene skipping.
     */
    enable_skipcutscenes() {
      recordMiscInstruction("enable_skipcutscenes");
    },
    /**
     * Disables cutscene skipping.
     */
    disable_skipcutscenes() {
      recordMiscInstruction("disable_skipcutscenes");
    },
    /**
     * Hides other players.
     */
    enable_hideplayers() {
      recordMiscInstruction("enable_hideplayers");
    },
    /**
     * Shows other players.
     */
    disable_hideplayers() {
      recordMiscInstruction("disable_hideplayers");
    },
    /**
     * Sets the player walk speed.
     *
     * @param speed - Walk speed value.
     * @example
     * cmd.set_walk_speed(16)
     */
    set_walk_speed(speed) {
      recordMiscInstruction(
        "set_walk_speed",
        Math.max(
          0,
          Math.floor(
            requireScriptArgumentNumber("set_walk_speed", "speed", speed),
          ),
        ),
      );
    },
    /**
     * Waits until the room has enough players, or exactly that many players.
     *
     * @param count - Player count to wait for.
     * @param exact - When true, waits for exactly `count`; otherwise waits for at least `count`.
     * @example
     * cmd.wait_for_player_count(5)
     * @example
     * cmd.wait_for_player_count(7, true)
     */
    wait_for_player_count(count, exact = false) {
      recordMiscInstruction(
        "wait_for_player_count",
        Math.max(
          0,
          Math.floor(
            requireScriptArgumentNumber(
              "wait_for_player_count",
              "count",
              count,
            ),
          ),
        ),
        readOptionalScriptArgumentBoolean(
          "wait_for_player_count",
          "exact",
          exact,
        ) ?? false,
      );
    },
    /**
     * Overrides the displayed player name.
     *
     * @param name - Display name.
     * @example
     * cmd.set_name("Guest")
     */
    set_name(name) {
      recordMiscInstruction(
        "set_name",
        requireScriptArgumentString("set_name", "name", name),
      );
    },
    /**
     * Overrides the displayed guild name.
     *
     * @param guild - Display guild name.
     * @example
     * cmd.set_guild("Legion")
     */
    set_guild(guild) {
      recordMiscInstruction(
        "set_guild",
        requireScriptArgumentString("set_guild", "guild", guild),
      );
    },
    /**
     * Buys enough Scroll of Life Steal to reach the requested quantity.
     *
     * @param quantity - Desired inventory quantity.
     * @example
     * cmd.buy_lifesteal(20)
     */
    buy_lifesteal(quantity) {
      recordMiscInstruction(
        "buy_lifesteal",
        positiveNumber("buy_lifesteal", "quantity", quantity),
      );
    },
    /**
     * Buys enough Scroll of Enrage to reach the requested quantity.
     *
     * @param quantity - Desired inventory quantity.
     * @example
     * cmd.buy_scroll_of_enrage(20)
     */
    buy_scroll_of_enrage(quantity) {
      recordMiscInstruction(
        "buy_scroll_of_enrage",
        positiveNumber("buy_scroll_of_enrage", "quantity", quantity),
      );
    },
    /**
     * Registers a named raw packet handler.
     *
     * @param type - Packet stream to observe.
     * @param name - Unique handler name within the packet stream.
     * @param handler - Function invoked with each raw packet.
     * @remark The same `(type, name)` pair replaces the previous handler.
     * @example
     * cmd.register_handler("pext", "debug", packet => console.info(packet))
     */
    register_handler(type, name, handler) {
      if (typeof handler !== "function") {
        throw new Error("cmd.register_handler: handler must be a function");
      }
      recordMiscInstruction(
        "register_handler",
        packetHandlerType(type),
        requireScriptArgumentString("register_handler", "name", name),
        handler,
      );
    },
    /**
     * Removes a previously registered packet handler.
     *
     * @param type - Packet stream passed to `register_handler`.
     * @param name - Handler name passed to `register_handler`.
     * @example
     * cmd.unregister_handler("pext", "debug")
     */
    unregister_handler(type, name) {
      recordMiscInstruction(
        "unregister_handler",
        packetHandlerType(type),
        requireScriptArgumentString("unregister_handler", "name", name),
      );
    },
    /**
     * Registers a script-local custom command.
     *
     * @param name - Command name to expose on `cmd`.
     * @param handler - Function invoked when the custom command runs.
     * @example
     * cmd.register_command("my_check", async ({ api, skipNext }) => {
     *   if (!(await api.inventory.contains("Token"))) return skipNext()
     * })
     */
    register_command(name, handler) {
      if (typeof handler !== "function") {
        throw new Error("cmd.register_command: handler must be a function");
      }
      recordMiscInstruction(
        "register_command",
        assertValidCustomCommandName("register_command", name),
        handler,
      );
    },
    /**
     * Removes a script-local custom command.
     *
     * @param name - Command name passed to `register_command`.
     */
    unregister_command(name) {
      recordMiscInstruction(
        "unregister_command",
        assertValidCustomCommandName("unregister_command", name),
      );
    },
    /**
     * Registers a script-local custom condition expression.
     *
     * @param name - Condition name to expose on `cmd`.
     * @param handler - Function invoked when the condition is evaluated.
     * @example
     * cmd.register_condition("has_token", async ({ api }) => {
     *   return await api.inventory.contains("Token")
     * })
     */
    register_condition(name, handler) {
      if (typeof handler !== "function") {
        throw new Error("cmd.register_condition: handler must be a function");
      }
      recordMiscInstruction(
        "register_condition",
        assertValidCustomCommandName("register_condition", name),
        handler,
      );
    },
    /**
     * Removes a script-local custom condition.
     *
     * @param name - Condition name passed to `register_condition`.
     */
    unregister_condition(name) {
      recordMiscInstruction(
        "unregister_condition",
        assertValidCustomCommandName("unregister_condition", name),
      );
    },
    /**
     * Enables the LedgerMayne auto-zone.
     */
    use_autozone_ledgermayne() {
      recordMiscInstruction("use_autozone_ledgermayne");
    },
    /**
     * Enables the MoreSkulls auto-zone.
     */
    use_autozone_moreskulls() {
      recordMiscInstruction("use_autozone_moreskulls");
    },
    /**
     * Enables the DarkCarnax auto-zone.
     */
    use_autozone_darkcarnax() {
      recordMiscInstruction("use_autozone_darkcarnax");
    },
    /**
     * Enables the UltraDage auto-zone.
     */
    use_autozone_ultradage() {
      recordMiscInstruction("use_autozone_ultradage");
    },
    /**
     * Enables the AstralShrine auto-zone.
     */
    use_autozone_astralshrine() {
      recordMiscInstruction("use_autozone_astralshrine");
    },
    /**
     * Enables the Queeniona auto-zone.
     */
    use_autozone_queeniona() {
      recordMiscInstruction("use_autozone_queeniona");
    },
    /**
     * Closes the game window.
     */
    close_window() {
      recordMiscInstruction("close_window");
    },
    /**
     * Plays a short beep.
     *
     * @param times - Number of beeps to play.
     * @example
     * cmd.beep()
     * @example
     * cmd.beep(3)
     */
    beep(times = 1) {
      recordMiscInstruction("beep", positiveNumber("beep", "times", times));
    },
    /**
     * Starts a named background task.
     *
     * @param name - Unique task name.
     * @param taskFn - Function to run in the background.
     * @example
     * cmd.register_task("heartbeat", () => console.info("tick"))
     */
    register_task(name, taskFn) {
      if (typeof taskFn !== "function") {
        throw new Error("cmd.register_task: taskFn must be a function");
      }
      recordMiscInstruction(
        "register_task",
        requireScriptArgumentString("register_task", "name", name),
        taskFn,
      );
    },
    /**
     * Stops a named background task.
     *
     * @param name - Task name passed to `register_task`.
     * @example
     * cmd.unregister_task("heartbeat")
     */
    unregister_task(name) {
      recordMiscInstruction(
        "unregister_task",
        requireScriptArgumentString("unregister_task", "name", name),
      );
    },
    /**
     * Equips and drinks one or more consumables, then optionally re-equips an item.
     *
     * @param items - Consumable item name or names.
     * @param equipAfter - Optional item to equip after drinking.
     * @example
     * cmd.drink_consumables("Felicitous Philtre", "Main Class")
     * @example
     * cmd.drink_consumables(["Body Tonic", "Potent Honor Potion"])
     */
    drink_consumables(items, equipAfter) {
      const normalizedItems = Array.isArray(items)
        ? items.map((item, index) =>
            requireScriptArgumentString(
              "drink_consumables",
              `items[${index}]`,
              item,
            ),
          )
        : requireScriptArgumentString("drink_consumables", "items", items);
      recordMiscInstruction(
        "drink_consumables",
        normalizedItems,
        readOptionalScriptArgumentString(
          "drink_consumables",
          "equipAfter",
          equipAfter,
        ),
      );
    },
    /**
     * Turns in the Wheel of Doom quest when enough Gear of Doom is available.
     *
     * @param toBank - Whether to bank remaining Gear of Doom afterward.
     * @example
     * cmd.do_wheelofdoom(true)
     */
    do_wheelofdoom(toBank = false) {
      recordMiscInstruction(
        "do_wheelofdoom",
        readOptionalScriptArgumentBoolean("do_wheelofdoom", "toBank", toBank) ??
          false,
      );
    },
    /**
     * Defines a jump target for `goto_label`.
     *
     * @param label - Label name.
     * @example
     * cmd.label("farm_loop")
     */
    label(label) {
      recordMiscInstruction(
        "label",
        requireScriptArgumentString("label", "label", label),
      );
    },
    /**
     * Jumps to a label.
     *
     * @param label - Label name.
     * @example
     * cmd.goto_label("farm_loop")
     */
    goto_label(label) {
      recordMiscInstruction(
        "goto_label",
        requireScriptArgumentString("goto_label", "label", label),
      );
    },
    /**
     * Stops the current script.
     *
     * @alias stop_bot
     */
    stop() {
      recordMiscInstruction("stop");
    },
  };

  return withScriptCommandAliases(commands, miscCommandAliases);
};
