import { ArgsError } from "../../ArgsError";
import { CommandArmyInit } from "./CommandArmyInit";
import { CommandArmyKill } from "./CommandKillWithArmy";
import { CommandArmyRegisterMessage } from "./CommandArmyRegisterMessage";
import { CommandArmySetConfigCommand } from "./CommandArmySetConfig";
import { CommandArmySetLogFileName } from "./CommandArmySetLogFileName";
import { CommandArmyWaitForArmy } from "./CommandArmyWaitForArmy";
import { CommandArmyBuff } from "./CommandArmyBuff";
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
  wait_for_army(map?: string, cell?: string, pad?: string) {
    if (map && typeof map !== "string") {
      throw new ArgsError("map must be a string");
    }

    if (cell && typeof cell !== "string") {
      throw new ArgsError("cell must be a string");
    }

    if (pad && typeof pad !== "string") {
      throw new ArgsError("pad must be a string");
    }

    const cmd = new CommandArmyWaitForArmy();
    if (map) cmd.map = map;
    cmd.cell = cell ?? "Enter";
    cmd.pad = pad ?? "Spawn";
    window.context.addCommand(cmd);
  },
  buff() {
    const cmd = new CommandArmyBuff();
    window.context.addCommand(cmd);
  },
};
