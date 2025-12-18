import { ArgsError } from "~/botting/ArgsError";
import { CommandBuy } from "./CommandBuy";
import { CommandDeposit } from "./CommandDeposit";
import { CommandEnhanceItem } from "./CommandEnhanceItem";
import { CommandEquipByEnhancement } from "./CommandEquipByEnhancement";
import { CommandEquipItem } from "./CommandEquipItem";
import { CommandGetMapItem } from "./CommandGetMapItem";
import { CommandLoadShop } from "./CommandLoadShop";
import { CommandPickup } from "./CommandPickup";
import { CommandRegisterBoost } from "./CommandRegisterBoost";
import { CommandRegisterDrop } from "./CommandRegisterDrop";
import { CommandReject } from "./CommandReject";
import { CommandSell } from "./CommandSell";
import { CommandSwap } from "./CommandSwap";
import { CommandUnregisterBoost } from "./CommandUnregisterBoost";
import { CommandUnregisterDrop } from "./CommandUnregisterDrop";
import { CommandWithdraw } from "./CommandWithdraw";

export const itemCommands = {
  /**
   * Buys an item from the shop.
   *
   * @remarks If an item that costs ACs is being bought, a confirmation dialog will appear.
   *
   * Auto mode may not be flawless and have edge cases. Report any issues!
   * @param shopId - The shop id.
   * @param item - The name or item id of the item to buy.
   * @param quantity - The quantity of the item to buy.
   * @param auto - If true, will try to buy any required items first (if available in the merge shop).
   */
  buy_item(
    shopId: number,
    item: number | string,
    quantity: number,
    auto: boolean = false,
  ) {
    if (!shopId || typeof shopId !== "number") {
      throw new ArgsError("shopId is required");
    }

    if (!item || (typeof item !== "number" && typeof item !== "string")) {
      throw new ArgsError("item is required");
    }

    if (!quantity || typeof quantity !== "number") {
      throw new ArgsError("quantity is required");
    }

    if (auto && typeof auto !== "boolean") {
      throw new ArgsError("auto is required");
    }

    const cmd = new CommandBuy();
    cmd.shopId = shopId;
    cmd.item = item;
    cmd.quantity = quantity;
    cmd.auto = auto;
    window.context.addCommand(cmd);
  },
  /**
   * Puts an item into the bank.
   *
   * @param item - The item to deposit. If provided an array, each item will be deposited.
   */
  deposit(item: (number | string)[] | number | string) {
    if (
      !item ||
      (Array.isArray(item) && item.length === 0) ||
      (!Array.isArray(item) &&
        typeof item !== "number" &&
        typeof item !== "string")
    ) {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandDeposit();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  get_map_item(item: number | string) {
    if (!item || (typeof item !== "number" && typeof item !== "string")) {
      throw new ArgsError("item is required");
    }

    if (typeof item === "string" && Number.isNaN(Number.parseInt(item, 10))) {
      throw new TypeError("item is required");
    }

    const cmd = new CommandGetMapItem();
    cmd.itemId = typeof item === "string" ? Number.parseInt(item, 10) : item;
    window.context.addCommand(cmd);
  },
  /**
   * Picks up an item from the drop list.
   *
   * @param item - The name or item id of the item to pick up.
   */
  pickup(item: number | string) {
    if (!item || (typeof item !== "number" && typeof item !== "string")) {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandPickup();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Rejects an item from the drop list.
   *
   * @param item - The name or item id of the item to reject.
   */
  reject(item: number | string) {
    if (!item || (typeof item !== "number" && typeof item !== "string")) {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandReject();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Sells an item.
   *
   * @param item - The name of the item to sell.
   */
  // TODO: support sell by itemID and add qty parameter
  sell_item(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandSell();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Swaps an item from the bank with an item from the inventory.
   *
   * @param bankItem - The name or item id of the item to swap from the bank.
   * @param invItem - The name or item id of the item to swap from the inventory.
   */
  swap(bankItem: number | string, invItem: number | string) {
    if (
      !bankItem ||
      (typeof bankItem !== "number" && typeof bankItem !== "string")
    ) {
      throw new ArgsError("bankItem is required");
    }

    if (
      !invItem ||
      (typeof invItem !== "number" && typeof invItem !== "string")
    ) {
      throw new ArgsError("invItem is required");
    }

    const cmd = new CommandSwap();
    cmd.bankItem = bankItem;
    cmd.invItem = invItem;
    window.context.addCommand(cmd);
  },
  /**
   * Takes out an item from the bank.
   *
   * @param item - The item to withdraw. If provided an array, each item will be withdrawn.
   */
  withdraw(item: (number | string)[] | number | string) {
    if (
      !item ||
      (Array.isArray(item) && item.length === 0) ||
      (!Array.isArray(item) &&
        typeof item !== "number" &&
        typeof item !== "string")
    ) {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandWithdraw();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Registers an item to be automatically picked up when possible.
   *
   * @param items - The name or item id of the item(s) to pick up.
   */
  register_drop(items: string[] | string) {
    const itemArray = Array.isArray(items) ? items : [items];
    if (
      itemArray.length === 0 ||
      itemArray.some((item) => typeof item !== "string")
    ) {
      throw new ArgsError("items is required");
    }

    const cmd = new CommandRegisterDrop();
    cmd.item = itemArray;
    window.context.addCommand(cmd);
  },
  /**
   * Unregisters an item from the drop list.
   *
   * @param items - The name or item id of the item(s) to unregister.
   */
  unregister_drop(items: string[] | string) {
    const itemArray = Array.isArray(items) ? items : [items];
    if (
      itemArray.length === 0 ||
      itemArray.some((item) => typeof item !== "string")
    ) {
      throw new ArgsError("items is required");
    }

    const cmd = new CommandUnregisterDrop();
    cmd.item = itemArray;
    window.context.addCommand(cmd);
  },
  /**
   * Registers a consumable boost to use when available.
   *
   * @param item - The name of the item boost to use.
   */
  register_boost(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandRegisterBoost();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  /**
   * Unregisters a consumable boost.
   *
   * @param item - The name of the item boost to unregister.
   */
  unregister_boost(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandUnregisterBoost();
    cmd.item = item;
    window.context.addCommand(cmd);
  },
  equip_item(item: string) {
    if (!item || typeof item !== "string") {
      throw new ArgsError("item is required");
    }

    const cmd = new CommandEquipItem();
    cmd.itemName = item;
    window.context.addCommand(cmd);
  },
  /**
   * Equips an item using its enhancement name.
   *
   * @example
   * ```js
   * // 1. forge + proc name
   * cmd.equip_item_by_enhancement("Forge", "Arcana's Concerto")
   * cmd.equip_item_by_enhancement("Forge", "arcanas") 
   * cmd.equip_item_by_enhancement("Forge", "Penitence")
   * cmd.equip_item_by_enhancement("Forge", "Anima")
   *
   * // 2. basic + awe proc (weapon)
   * cmd.equip_item_by_enhancement("Lucky", "Spiral Carve")
   * cmd.equip_item_by_enhancement("Fighter", "Awe Blast")
   *
   * // 3. basic + item type filter
   * cmd.equip_item_by_enhancement("Lucky", "Weapon")
   * cmd.equip_item_by_enhancement("Fighter", "Cape")
   *
   * // 4. basic only (first match)
   * cmd.equip_item_by_enhancement("Fighter")
   * cmd.equip_item_by_enhancement("Lucky")
   * ```
   * @param enhancementName - The enhancement name (Lucky, Fighter, etc.) or "Forge" for proc matching.
   * @param procOrItemType - If the enhancement name is "Forge", this should be the proc name. Otherwise, this should be the item type (weapon, helm, cape) or Awe proc if applicable.
   */
  equip_item_by_enhancement(enhancementName: string, procOrItemType?: string) {
    if (typeof enhancementName !== "string") {
      throw new ArgsError("enhancementName is required");
    }

    if (procOrItemType && typeof procOrItemType !== "string") {
      throw new ArgsError("procOrItemType is required");
    }

    const cmd = new CommandEquipByEnhancement();
    cmd.enhancementName = enhancementName;
    if (procOrItemType) cmd.procOrItemType = procOrItemType;

    window.context.addCommand(cmd);
  },
  /**
   * Loads a shop.
   *
   * @param shopId - The shop id to load.
   */
  load_shop(shopId: number) {
    if (!shopId || typeof shopId !== "number") {
      throw new ArgsError("shopId is required");
    }

    const cmd = new CommandLoadShop();
    cmd.shopId = shopId;
    window.context.addCommand(cmd);
  },
  /**
   * Enhances an item with the specified enhancement.
   *
   * @example
   * ```js
   * // Basic enhancement
   * cmd.enhance_item("Void Highlord", "Lucky")
   *
   * // Awe enhancement (weapon only) - base type + Awe proc
   * cmd.enhance_item("Weapon", "Lucky", "Spiral Carve")
   * cmd.enhance_item("Weapon", "Fighter", "Awe Blast")
   *
   * // Forge enhancement - item type is deduced from item name
   * cmd.enhance_item("Necrotic Sword", "Forge") // base Forge
   * cmd.enhance_item("Necrotic Sword", "Forge", "Valiance") // weapon Forge proc
   * cmd.enhance_item("Cape", "Forge", "Vainglory") // cape Forge special
   * cmd.enhance_item("Helm", "Forge", "Anima") // helm Forge special
   * ```
   * @param itemName - The name of the item to enhance.
   * @param enhancementName - The enhancement type (Lucky, Fighter, Wizard, etc.) or "Forge".
   * @param procName - Optional. Awe proc (Spiral Carve) or Forge proc (Valiance, Vainglory, Anima).
   */
  enhance_item(itemName: string, enhancementName: string, procName?: string) {
    if (!itemName || typeof itemName !== "string") {
      throw new ArgsError("itemName is required");
    }

    if (!enhancementName || typeof enhancementName !== "string") {
      throw new ArgsError("enhancementName is required");
    }

    if (procName && typeof procName !== "string") {
      throw new ArgsError("procName is required");
    }

    const cmd = new CommandEnhanceItem();
    cmd.itemName = itemName;
    cmd.enhancementName = enhancementName;
    if (procName) cmd.procName = procName;
    window.context.addCommand(cmd);
  },

};
