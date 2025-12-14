import { Collection } from "@vexed/collection";
import type { AddItemsPacket } from "../packet-handlers/json";
import type { Bot } from "./Bot";
import type { ItemData } from "./models/Item";
import { TempInventoryItem } from "./models/TempInventoryItem";

export class TempInventory {
  #items = new Collection<number, TempInventoryItem>();

  public constructor(public bot: Bot) { }

  /**
   * @internal
   * Handles addItems packets to update temp inventory (bTemp=1).
   */
  public _handleAddItems(packet: AddItemsPacket): void {
    for (const [, itemData] of Object.entries(packet.items)) {
      if (itemData.bTemp !== 1) continue;

      const existing = this.#items.get(itemData.ItemID);
      if (existing) {
        existing.data.iQty = itemData.iQtyNow ?? existing.data.iQty + 1;
      } else {
        this.#items.set(
          itemData.ItemID,
          new TempInventoryItem(itemData as ItemData),
        );
      }
    }
  }

  /**
   * @internal
   * Removes temp items (e.g., from turnIn).
   */
  public _removeItem(itemId: number, quantity: number): void {
    const item = this.#items.get(itemId);
    if (!item) return;

    const newQty = item.quantity - quantity;
    if (newQty <= 0) {
      this.#items.delete(itemId);
    } else {
      item.data.iQty = newQty;
    }
  }

  /**
   * @internal
   * Clears temp inventory (e.g., on map change).
   */
  public _clear(): void {
    this.#items.clear();
  }

  /**
   * The collection of items in the temp inventory.
   */
  public get items(): Collection<number, TempInventoryItem> {
    return this.#items;
  }

  /**
   * Gets an item from the temp inventory.
   *
   * @param itemKey - The name or ID of the item.
   */
  public get(itemKey: number | string): TempInventoryItem | null {
    if (typeof itemKey === "number") {
      return this.#items.get(itemKey) ?? null;
    }

    const lowerKey = itemKey.toLowerCase();
    return (
      this.#items.find((item) => item.name.toLowerCase() === lowerKey) ?? null
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
