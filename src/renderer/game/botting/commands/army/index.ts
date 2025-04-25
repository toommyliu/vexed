import { ArgsError } from "../../ArgsError";
import { CommandArmyInit } from "./CommandArmyInit";
import { CommandArmyJoin } from "./CommandArmyJoin";
import { CommandArmyRegisterMessage } from "./CommandArmyRegisterMessage";
import { CommandArmySetConfigCommand } from "./CommandArmySetConfig";
import { CommandArmySetLogFileName } from "./CommandArmySetLogFileName";
import { CommandArmyWaitForArmy } from "./CommandArmyWaitForArmy";

export const armyCommands = {
  army_init() {
    const cmd = new CommandArmyInit();
    window.context.addCommand(cmd);
  },
  register_msg(msg: string) {
    if (!msg || typeof msg !== "string") {
      throw new Error("msg is required");
    }

    const cmd = new CommandArmyRegisterMessage();
    cmd.message = msg;
    window.context.addCommand(cmd);
  },
  set_config(fileName: string) {
    if (!fileName || typeof fileName !== "string") {
      throw new ArgsError("fileName is required");
    }

    const cmd = new CommandArmySetConfigCommand();
    cmd.fileName = fileName;
    window.context.addCommand(cmd);
  },
  set_log(fileName: string) {
    if (!fileName || typeof fileName !== "string") {
      throw new ArgsError("fileName is required");
    }

    const cmd = new CommandArmySetLogFileName();
    cmd.fileName = fileName;
    window.context.addCommand(cmd);
  },
  army_join(map: string, cell: string, pad: string) {
    if (!map || typeof map !== "string") {
      throw new ArgsError("map is required");
    }

    if (!cell || typeof cell !== "string") {
      throw new ArgsError("cell is required");
    }

    if (!pad || typeof pad !== "string") {
      throw new ArgsError("pad is required");
    }

    const cmd = new CommandArmyJoin();
    cmd.mapName = map;
    cmd.cellName = cell;
    cmd.padName = pad;
    window.context.addCommand(cmd);
  },
  wait_for_army(map?: string, cell?: string, pad?: string) {
    if (map && typeof map !== "string") {
      throw new ArgsError("map is required");
    }

    if (cell && typeof cell !== "string") {
      throw new ArgsError("cell is required");
    }

    if (pad && typeof pad !== "string") {
      throw new ArgsError("pad is required");
    }

    const cmd = new CommandArmyWaitForArmy();
    if (map) cmd.map = map;
    cmd.cell = cell ?? "Enter";
    cmd.pad = pad ?? "Spawn";
    window.context.addCommand(cmd);
  },
};
