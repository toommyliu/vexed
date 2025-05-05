import { KillOptions } from "../../../lib/Combat";
import { ArgsError } from "../../ArgsError";
import { CommandArmyEquipItem } from "./CommandArmyEquipItem";
import { CommandArmyInit } from "./CommandArmyInit";
import { CommandArmyJoin } from "./CommandArmyJoin";
import { CommandArmyKill } from "./CommandArmyKill";
import { CommandArmySetConfigCommand } from "./CommandArmySetConfig";
import { CommandExecuteWithArmy } from "./CommandExecuteWithArmy";

export const armyCommands = {
  army_init() {
    const cmd = new CommandArmyInit();
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
  army_kill(targetName: string, options?: Partial<KillOptions>) {
    if (!targetName || typeof targetName !== "string") {
      throw new ArgsError("targetName is required");
    }

    const cmd = new CommandArmyKill();
    cmd.targetName = targetName;
    cmd.options = options ?? {};
    window.context.addCommand(cmd);
  },
  army_kill_for(
    targetName: string,
    itemName: string,
    qty: number,
    isTemp: boolean,
    options?: Partial<KillOptions>,
  ) {
    if (!targetName || typeof targetName !== "string") {
      throw new ArgsError("targetName is required");
    }

    if (!itemName || typeof itemName !== "string") {
      throw new ArgsError("itemName is required");
    }

    if (!qty || typeof qty !== "number") {
      throw new ArgsError("qty is required");
    }

    if (typeof isTemp !== "boolean") {
      throw new ArgsError("isTemp is required");
    }

    const cmd = new CommandArmyKill();
    cmd.targetName = targetName;
    cmd.itemName = itemName;
    cmd.qty = qty;
    cmd.isTemp = isTemp;
    cmd.options = options ?? {};
    window.context.addCommand(cmd);
  },
  execute_with_army(fn: () => Promise<void>) {
    if (!fn || typeof fn !== "function") {
      throw new ArgsError("fn is required");
    }

    const cmd = new CommandExecuteWithArmy();
    cmd.fn = fn.bind({ allDone: cmd.allDone });
    window.context.addCommand(cmd);
  },
  army_equip_item(itemName: string) {
    if (!itemName || typeof itemName !== "string") {
      throw new ArgsError("itemName is required");
    }

    const cmd = new CommandArmyEquipItem();
    cmd.configKey = itemName;
    window.context.addCommand(cmd);
  },
};
