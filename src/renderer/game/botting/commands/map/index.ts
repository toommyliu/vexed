import { ArgsError } from "../../ArgsError";
import { CommandJoinMap } from "./CommandJoinMap";
import { CommandMoveToCell } from "./CommandMoveToCell";
import { CommandSetSpawnpoint } from "./CommandSetSpawnpoint";
import { CommandWalkTo } from "./CommandWalkTo";

export const mapCommands = {
  /**
   * Joins a map.
   *
   * @param map - The map to join.
   * @param cell - The cell to join.
   * @param pad - The pad to join.
   */
  join(map: string, cell: string = "Enter", pad: string = "Spawn") {
    if (!map || typeof map !== "string") {
      throw new ArgsError("map is required");
    }

    const cmd = new CommandJoinMap();
    cmd.map = map;
    cmd.cell = cell;
    cmd.pad = pad;
    window.context.addCommand(cmd);
  },
  /**
   * Moves to a cell.
   *
   * @param cell - The cell to move to.
   * @param pad - The pad to move to.
   */
  move_to_cell(cell: string, pad: string = "Spawn") {
    if (!cell || typeof cell !== "string") {
      throw new ArgsError("cell is required");
    }

    const cmd = new CommandMoveToCell();
    cmd.cell = cell;
    cmd.pad = pad;
    window.context.addCommand(cmd);
  },
  /**
   * Sets the spawnpoint.
   *
   * @param cell - The cell to spawn in.
   * @param pad - The pad to spawn in.
   */
  set_spawn(cell?: string, pad?: string) {
    const cmd = new CommandSetSpawnpoint();
    if (typeof cell === "string") {
      cmd.cell = cell;
    }

    if (typeof pad === "string") {
      cmd.pad = pad;
    }

    window.context.addCommand(cmd);
  },
  /**
   * Walks to a point on the map.
   *
   * @param x - The x coordinate to walk to.
   * @param y - The y coordinate to walk to.
   */
  walk_to(x: number, y: number) {
    if (!x || typeof x !== "number") {
      throw new ArgsError("x is required");
    }

    if (!y || typeof y !== "number") {
      throw new ArgsError("y is required");
    }

    const cmd = new CommandWalkTo();
    cmd.x = x;
    cmd.y = y;
    window.context.addCommand(cmd);
  },
};
