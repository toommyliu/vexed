import { tempInventory } from "~/lib/stores/temp-inventory";
import type { Bot } from "../Bot";

export class TempInventory {
  public constructor(public bot: Bot) {}

  /**
   * Items in the player's temp inventory.
   */
  public get items() {
    return tempInventory.all();
  }

  /**
   * Gets an item from the temp inventory.
   *
   * @param key - The name or ID of the item.
   */
  public get(key: number | string) {
    if (typeof key === "number") return tempInventory.get(key);
    if (typeof key === "string") return tempInventory.getByName(key);
    return undefined;
  }

  /**
   * Whether an item meets the quantity in the temp inventory.
   *
   * @param itemKey - The name or ID of the item.
   * @param quantity - The quantity of the item.
   */
  public contains(itemKey: number | string, quantity: number = 1): boolean {
    const item = this.get(itemKey);
    return item !== undefined && item.quantity >= quantity;
  }
}
