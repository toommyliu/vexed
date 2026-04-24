import { Effect } from "effect";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  readOptionalInstructionString,
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
  goto_player: [player: string];
  goto_house: [player?: string];
  set_spawnpoint: [cell?: string, pad?: string];
};

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

    yield* context.run(context.player.joinMap(map, cell, pad));
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

    yield* context.run(context.player.jumpToCell(cell, pad));
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
    yield* context.run(context.player.goToPlayer(player));
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
    const houseMap = player === undefined ? "house" : `${player}-house`;

    yield* context.run(context.player.joinMap(houseMap));
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

    yield* context.run(context.world.map.setSpawnPoint(cell, pad));
  }),
);

const mapCommandHandlerMap = mapCommandDomain.defineHandlers({
  join_map: joinMapCommand,
  move_to_cell: moveToCellCommand,
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
     * @alias join
     * @param map Map name.
     * @param cell Optional cell name.
     * @param pad Optional pad name.
     * @example cmd.join_map("battleon", "Enter", "Spawn")
     */
    join_map(map: string, cell?: string, pad?: string) {
      recordMapInstruction(
        "join_map",
        requireScriptArgumentString("join_map", "map", map),
        readOptionalScriptArgumentString("join_map", "cell", cell),
        readOptionalScriptArgumentString("join_map", "pad", pad),
      );
    },

    /**
     * Moves the player to a cell and optional pad.
     *
     * @alias jump_to_cell
     * @param cell Cell name.
     * @param pad Optional pad name.
     */
    move_to_cell(cell: string, pad?: string) {
      recordMapInstruction(
        "move_to_cell",
        requireScriptArgumentString("move_to_cell", "cell", cell),
        readOptionalScriptArgumentString("move_to_cell", "pad", pad),
      );
    },

    /**
     * Go to another player. 
     *
     * @param player Player name.
     */
    goto_player(player: string) {
      recordMapInstruction(
        "goto_player",
        requireScriptArgumentString("goto_player", "player", player),
      );
    },

    /**
     * Goes to the player's house.
     * @param player Optional player name.
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
     * @alias set_spawn
     * @param cell Optional cell name.
     * @param pad Optional pad name.
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
