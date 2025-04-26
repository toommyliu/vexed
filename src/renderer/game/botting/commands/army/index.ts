import { ArgsError } from "../../ArgsError";
import { CommandArmyEquipLoadout } from "./CommandArmyEquipLoadout";
import { CommandArmyInit } from "./CommandArmyInit";
import { CommandArmyJoin } from "./CommandArmyJoin";
import { CommandArmyKill } from "./CommandArmyKill";
import { CommandArmyRegisterMessage } from "./CommandArmyRegisterMessage";
import { CommandArmySetConfigCommand } from "./CommandArmySetConfig";
import { CommandArmySetLogFileName } from "./CommandArmySetLogFileName";

export const armyCommands = {
  army_init() {
    const cmd = new CommandArmyInit();
    window.context.addCommand(cmd);
  },
  army_register_msg(msg: string) {
    if (!msg || typeof msg !== "string") {
      throw new Error("msg is required");
    }

    const cmd = new CommandArmyRegisterMessage();
    cmd.message = msg;
    window.context.addCommand(cmd);
  },
  army_set_config(fileName: string) {
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
  army_equip_loadout(loadoutName: string) {
    if (!loadoutName || typeof loadoutName !== "string") {
      throw new ArgsError("loadoutName is required");
    }

    const cmd = new CommandArmyEquipLoadout();
    cmd.loadoutName = loadoutName;
    window.context.addCommand(cmd);
  },
  army_kill() {
    const cmd = new CommandArmyKill();
    window.context.addCommand(cmd);
  },
};
