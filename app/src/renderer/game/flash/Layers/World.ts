import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { World } from "../Services/World";
import type { WorldShape } from "../Services/World";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    getId: () => bridge.call("world.getRoomId"),
    getRoomNumber: () => bridge.call("world.getRoomNumber"),
    getPlayerNames: () =>
      Effect.map(bridge.call("world.getPlayerNames"), (names) =>
        names.filter((name): name is string => typeof name === "string"),
      ),
    getCellMonsters: () => bridge.call("world.getCellMonsters"),
    getCells: () =>
      Effect.map(bridge.call("world.getCells"), (cells) =>
        cells.filter((cell): cell is string => typeof cell === "string"),
      ),
    getCellPads: () =>
      Effect.map(bridge.call("world.getCellPads"), (pads) =>
        pads.filter((pad): pad is string => typeof pad === "string"),
      ),
    isLoaded: () => bridge.call("world.isLoaded"),
    isActionAvailable: (gameAction: string) =>
      bridge.call("world.isActionAvailable", [gameAction]),
    getMapItem: (itemId: number) => bridge.call("world.getMapItem", [itemId]),
    loadSwf: (path: string) => bridge.call("world.loadSwf", [path]),
    reload: () => bridge.call("world.reload"),
    setSpawnPoint: (cell?: string, pad?: string) =>
      cell === undefined && pad === undefined
        ? bridge.call("world.setSpawnPoint")
        : bridge.call("world.setSpawnPoint", [cell, pad]),
    isPlayerInCell: (name: string, cell?: string) =>
      cell === undefined
        ? bridge.call("world.isPlayerInCell", [name])
        : bridge.call("world.isPlayerInCell", [name, cell]),
  } satisfies WorldShape;
});

export const WorldLive = Layer.effect(World, make);
