import type { TempInventoryItem } from "@vexed/game";
import type { Bot } from "./Bot";
import { tempInventory } from "./stores/temp-inventory";

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
   * @param itemKey - The name or ID of the item.
   */
  public get(itemKey: number | string): TempInventoryItem | null {
    const val = typeof itemKey === "string" ? itemKey.toLowerCase() : itemKey;

    return (
      this.items.find((item) => {
        if (typeof val === "string") {
          return item.name.toLowerCase() === val;
        } else if (typeof val === "number") {
          return item.id === val;
        }

        return false;
      }) ?? null
    );
  }

  /**
   * Whether an item meets the quantity in the temp inventory.
   *
   * @param itemKey - The name or ID of the item.
   * @param quantity - The quantity of the item.
   */
  public contains(itemKey: number | string, quantity: number = 1): boolean {
    const item = this.get(itemKey);
    return item !== null && item.quantity >= quantity;
  }
}
