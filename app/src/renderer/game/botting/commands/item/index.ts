import { ArgsError } from "@botting/ArgsError";
import { CommandBuy } from "./CommandBuy";
import { CommandDeposit } from "./CommandDeposit";
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
   * @param shopId - The shop id.
   * @param item - The name or item id of the item to buy.
   * @param quantity - The quantity of the item to buy.
   */
  buy_item(shopId: number, item: number | string, quantity: number) {
    if (!shopId || typeof shopId !== "number") {
      throw new ArgsError("shopId is required");
    }

    if (!item || (typeof item !== "number" && typeof item !== "string")) {
      throw new ArgsError("item is required");
    }

    if (!quantity || typeof quantity !== "number") {
      throw new ArgsError("quantity is required");
    }

    const cmd = new CommandBuy();
    cmd.shopId = shopId;
    cmd.item = item;
    cmd.quantity = quantity;
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
   * @param rejectElse - Whether to reject items not in the pick up list.
   */
  register_drop(items: string[] | string, rejectElse: boolean = false) {
    const itemArray = Array.isArray(items) ? items : [items];
    if (
      itemArray.length === 0 ||
      itemArray.some((item) => typeof item !== "string")
    ) {
      throw new ArgsError("items is required");
    }

    if (typeof rejectElse !== "boolean") {
      throw new ArgsError("rejectElse must be a boolean");
    }

    const cmd = new CommandRegisterDrop();
    cmd.item = itemArray;
    cmd.rejectElse = rejectElse;
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
   * Equips an item using its enhancement name. Supports colloquial variants of the enhancement name.
   *
   * If results are ambiguous, the first matching item will be used. Use itemType to narrow the result.
   *
   * @example
   * ```js
   * cmd.equip_item_by_enhancement("Lucky", "weapon")
   * cmd.equip_item_by_enhancement("Arcanas")
   * cmd.equip_item_by_enhancement("Peni")
   * ```
   * @param enhancementName - The name of the enhancement.
   * @param itemType - The type of item to equip. Can be "weapon", "helm", or "cape".
   */
  equip_item_by_enhancement(enhancementName: string, itemType?: string) {
    if (typeof enhancementName !== "string") {
      throw new ArgsError("enhancementName is required");
    }

    if (
      typeof itemType === "string" &&
      !["weapon", "helm", "cape"].includes(itemType.toLowerCase())
    ) {
      throw new ArgsError("itemType is required");
    }

    const cmd = new CommandEquipByEnhancement();
    cmd.enhancementName = enhancementName;
    if (itemType) cmd.itemType = itemType;

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
};
