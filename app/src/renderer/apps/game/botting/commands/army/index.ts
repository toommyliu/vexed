import type { KillOptions } from "../../../lib/Combat";
import { ArgsError } from "../../ArgsError";
import { CommandArmyEquipSet } from "./CommandArmyEquipSet";
// import { CommandArmyEquipItem } from "./CommandArmyEquipItem";
import { CommandArmyInit } from "./CommandArmyInit";
import { CommandArmyJoin } from "./CommandArmyJoin";
import { CommandArmyKill } from "./CommandArmyKill";
import { CommandArmySetConfigCommand } from "./CommandArmySetConfig";
import { CommandExecuteWithArmy } from "./CommandExecuteWithArmy";

export const armyCommands = {
  /**
   * Initializes the army.
   */
  army_init() {
    const cmd = new CommandArmyInit();
    window.context.addCommand(cmd);
  },
  /**
   * Sets the config file name.
   *
   * @param fileName - The name of the config file.
   */
  army_set_config(fileName: string) {
    if (!fileName || typeof fileName !== "string") {
      throw new ArgsError("fileName is required");
    }

    const cmd = new CommandArmySetConfigCommand();
    cmd.fileName = fileName;
    window.context.addCommand(cmd);
  },
  /**
   * Joins the map but waits for all players in the group to join before proceeding.
   *
   * @param map - The name of the map to join.
   * @param cell - The name of the cell to join.
   * @param pad - The name of the pad to join.
   */
  army_join(map: string, cell?: string, pad?: string) {
    if (!map || typeof map !== "string") {
      throw new ArgsError("map is required");
    }

    if (cell && typeof cell !== "string") {
      throw new ArgsError("cell is required");
    }

    if (pad && typeof pad !== "string") {
      throw new ArgsError("pad is required");
    }

    const cmd = new CommandArmyJoin();
    cmd.mapName = map;
    if (cell) cmd.cellName = cell;
    if (pad) cmd.padName = pad;
    window.context.addCommand(cmd);
  },
  /**
   * Kills the target, but waits for all players in the group to finish before proceeding.
   *
   * @param targetName - The name of the target to kill.
   * @param options - The options for the kill.
   */
  army_kill(targetName: string, options?: Partial<KillOptions>) {
    if (!targetName || typeof targetName !== "string") {
      throw new ArgsError("targetName is required");
    }

    const cmd = new CommandArmyKill();
    cmd.targetName = targetName;
    cmd.options = options ?? {};
    window.context.addCommand(cmd);
  },
  /**
   * Kills the target for a specified item, but waits for all players in the group to get the item before proceeding.
   *
   * @param targetName - The name of the target to kill.
   * @param itemName - The name of the item to get.
   * @param qty - The quantity of the item to get.
   * @param isTemp - Whether the item is temporary or not.
   * @param options - The options for the kill.
   */
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
  /**
   * Kills the target for a specified permanent item, waiting for all players to get the item.
   *
   * @param targetName - The name of the target to kill.
   * @param itemName - The name of the item to get.
   * @param qty - The quantity of the item to get.
   * @param options - The options for the kill.
   */
  army_kill_for_item(
    targetName: string,
    itemName: string,
    qty: number,
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

    const cmd = new CommandArmyKill();
    cmd.targetName = targetName;
    cmd.itemName = itemName;
    cmd.qty = qty;
    cmd.isTemp = false;
    cmd.options = options ?? {};
    window.context.addCommand(cmd);
  },
  /**
   * Kills the target for a specified temporary item, waiting for all players to get the item.
   *
   * @param targetName - The name of the target to kill.
   * @param itemName - The name of the temporary item to get.
   * @param qty - The quantity of the item to get.
   * @param options - The options for the kill.
   */
  army_kill_for_tempitem(
    targetName: string,
    itemName: string,
    qty: number,
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

    const cmd = new CommandArmyKill();
    cmd.targetName = targetName;
    cmd.itemName = itemName;
    cmd.qty = qty;
    cmd.isTemp = true;
    cmd.options = options ?? {};
    window.context.addCommand(cmd);
  },
  /**
   * Executes a function, but waits for the function (a.k.a for all players) to finish before proceeding.
   *
   * @param fn - The function to execute with the army.
   * @param fnName - The name of the function to execute.
   */
  execute_with_army(fn: () => Promise<void>, fnName?: string) {
    if (!fn || typeof fn !== "function") {
      throw new ArgsError("fn is required");
    }

    const cmd = new CommandExecuteWithArmy();
    cmd.fn = fn;
    if (typeof fnName === "string") cmd.fnName = fnName;
    window.context.addCommand(cmd);
  },
  // /**
  //  * Equips an item by key from the config file.
  //  *
  //  * @param itemName - The name of the item to equip.
  //  */
  // army_equip_item(itemName: string) {
  //   if (!itemName || typeof itemName !== "string") {
  //     throw new ArgsError("itemName is required");
  //   }

  //   const cmd = new CommandArmyEquipItem();
  //   cmd.configKey = itemName;
  //   window.context.addCommand(cmd);
  // },
  /**
   * Equips a set from the army config file.
   *
   * @param setName - The name of the set to equip.
   * @param refMode - Whether to resolve item names through a common lookup table.
   */
  army_equip_set(setName: string, refMode: boolean = false) {
    if (!setName || typeof setName !== "string") {
      throw new ArgsError("setName is required");
    }

    if (typeof refMode !== "boolean") {
      throw new ArgsError("refMode is required");
    }

    const cmd = new CommandArmyEquipSet();
    cmd.setName = setName;
    cmd.refMode = refMode;
    window.context.addCommand(cmd);
  },
};
