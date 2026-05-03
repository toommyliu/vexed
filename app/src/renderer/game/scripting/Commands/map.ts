import { Effect } from "effect";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  requireInstructionNumber,
  readOptionalInstructionString,
  requireScriptArgumentNumber,
  readOptionalScriptArgumentString,
  requireInstructionString,
  requireScriptArgumentString,
  type ScriptCommandAliasMap,
  type ScriptCommandDsl,
  type ScriptCommandDslWithAliases,
  withScriptCommandAliases,
  type ScriptInstructionRecorder,
} from "./commandDsl";

type MapScriptCommandArguments = {
  join_map: [map: string, cell?: string, pad?: string];
  move_to_cell: [cell: string, pad?: string];
  walk_to: [x: number, y: number];
  goto_player: [player: string];
  goto_house: [player?: string];
  set_spawnpoint: [cell?: string, pad?: string];
};

const DEFAULT_JOIN_CELL = "Enter";
const DEFAULT_PAD = "Spawn";

const mapCommandAliases = {
  join: "join_map",
  jump_to_cell: "move_to_cell",
  jump: "move_to_cell",
  set_spawn: "set_spawnpoint",
} as const satisfies ScriptCommandAliasMap<MapScriptCommandArguments>;

type MapScriptDsl = ScriptCommandDslWithAliases<
  MapScriptCommandArguments,
  typeof mapCommandAliases
>;
const mapCommandDomain = defineScriptCommandDomain<MapScriptCommandArguments>();

const joinMapCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const map = yield* requireInstructionString(
      context,
      "join_map",
      args,
      0,
      "map",
    );
    const cell = yield* readOptionalInstructionString(
      context,
      "join_map",
      args,
      1,
      "cell",
    );
    const pad = yield* readOptionalInstructionString(
      context,
      "join_map",
      args,
      2,
      "pad",
    );

    yield* context.player.joinMap(
      map,
      cell ?? DEFAULT_JOIN_CELL,
      pad ?? DEFAULT_PAD,
    );
  }),
);

const moveToCellCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const cell = yield* requireInstructionString(
      context,
      "move_to_cell",
      args,
      0,
      "cell",
    );
    const pad = yield* readOptionalInstructionString(
      context,
      "move_to_cell",
      args,
      1,
      "pad",
    );

    yield* context.player.jumpToCell(cell, pad ?? DEFAULT_PAD);
  }),
);

const walkToCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const x = yield* requireInstructionNumber(context, "walk_to", args, 0, "x");
    const y = yield* requireInstructionNumber(context, "walk_to", args, 1, "y");

    yield* context.player.walkTo(x, y);
  }),
);

const gotoPlayerCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const player = yield* requireInstructionString(
      context,
      "goto_player",
      args,
      0,
      "player",
    );
    yield* context.player.goToPlayer(player);
  }),
);

const gotoHouseCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const player = yield* readOptionalInstructionString(
      context,
      "goto_house",
      args,
      0,
      "player",
    );

    yield* Effect.gen(function* () {
      yield* context.combat.exit();
      yield* context.world.map.waitForGameAction("tfer");

      const playerName =
        player === undefined ? yield* context.auth.getUsername() : player;

      yield* context.packet.sendServer(`%xt%zm%house%1%${playerName}%`);
    });
  }),
);

const setSpawnPointCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const cell = yield* readOptionalInstructionString(
      context,
      "set_spawnpoint",
      args,
      0,
      "cell",
    );
    const pad = yield* readOptionalInstructionString(
      context,
      "set_spawnpoint",
      args,
      1,
      "pad",
    );

    yield* context.world.map.setSpawnPoint(cell, pad);
  }),
);

const mapCommandHandlerMap = mapCommandDomain.defineHandlers({
  join_map: joinMapCommand,
  move_to_cell: moveToCellCommand,
  walk_to: walkToCommand,
  goto_player: gotoPlayerCommand,
  goto_house: gotoHouseCommand,
  set_spawnpoint: setSpawnPointCommand,
});

export const mapCommandHandlers = mapCommandDomain.handlerEntriesWithAliases(
  mapCommandHandlerMap,
  mapCommandAliases,
);

export const createMapScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): MapScriptDsl => {
  const recordMapInstruction =
    mapCommandDomain.createInstructionRecorder(recordInstruction);

  const commands: ScriptCommandDsl<MapScriptCommandArguments> = {
    /**
     * Joins a map, optionally targeting a cell and pad.
     *
     * @param map - Map name.
     * @param cell - Optional cell name.
     * @param pad - Optional pad name.
     * @alias join
     * @example
     * cmd.join_map("battleon", "Enter", "Spawn")
     * @example
     * cmd.join("battleon")
     */
    join_map(
      map: string,
      cell: string = DEFAULT_JOIN_CELL,
      pad: string = DEFAULT_PAD,
    ) {
      recordMapInstruction(
        "join_map",
        requireScriptArgumentString("join_map", "map", map),
        requireScriptArgumentString("join_map", "cell", cell),
        requireScriptArgumentString("join_map", "pad", pad),
      );
    },

    /**
     * Moves the player to a cell and optional pad.
     *
     * @param cell - Cell name.
     * @param pad - Optional pad name.
     * @alias jump_to_cell
     * @alias jump
     * @example
     * cmd.move_to_cell("Boss", "Left")
     * @example
     * cmd.jump_to_cell("Enter")
     */
    move_to_cell(cell: string, pad: string = DEFAULT_PAD) {
      recordMapInstruction(
        "move_to_cell",
        requireScriptArgumentString("move_to_cell", "cell", cell),
        requireScriptArgumentString("move_to_cell", "pad", pad),
      );
    },

    /**
     * Walks to a point on the map.
     *
     * @param x - X coordinate.
     * @param y - Y coordinate.
     * @example
     * cmd.walk_to(450, 320)
     */
    walk_to(x: number, y: number) {
      recordMapInstruction(
        "walk_to",
        requireScriptArgumentNumber("walk_to", "x", x),
        requireScriptArgumentNumber("walk_to", "y", y),
      );
    },

    /**
     * Goes to another player.
     *
     * @param player - Player name.
     * @example
     * cmd.goto_player("Artix")
     */
    goto_player(player: string) {
      recordMapInstruction(
        "goto_player",
        requireScriptArgumentString("goto_player", "player", player),
      );
    },

    /**
     * Goes to the player's house.
     *
     * @param player - Optional player name. Defaults to the current player.
     * @example
     * cmd.goto_house()
     * @example
     * cmd.goto_house("Artix")
     */
    goto_house(player?: string) {
      recordMapInstruction(
        "goto_house",
        readOptionalScriptArgumentString("goto_house", "player", player),
      );
    },

    /**
     * Sets the spawn point.
     *
     * @param cell - Optional cell name.
     * @param pad - Optional pad name.
     * @alias set_spawn
     * @example
     * cmd.set_spawnpoint("Boss", "Left")
     * @example
     * cmd.set_spawn("Enter", "Spawn")
     */
    set_spawnpoint(cell?: string, pad?: string) {
      recordMapInstruction(
        "set_spawnpoint",
        readOptionalScriptArgumentString("set_spawnpoint", "cell", cell),
        readOptionalScriptArgumentString("set_spawnpoint", "pad", pad),
      );
    },
  };

  return withScriptCommandAliases(commands, mapCommandAliases);
};
