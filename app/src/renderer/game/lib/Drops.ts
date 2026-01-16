import type { ItemData } from "@vexed/game";
import type { Bot } from "./Bot";

export class Drops {
  /**
   * A map of item IDs to their associated item data.
   */
  readonly #itemData = new Map<number, ItemData>();

  /**
   * A map of item IDs to their count in the drop stack.
   */
  #dropCounts = new Map<number, number>();

  public constructor(public readonly bot: Bot) {}

  /**
   * Retrieves the drop stack as is.
   */
  public get dropCounts(): Readonly<Map<number, number>> {
    return this.#dropCounts;
  }

  /**
   * String representation of the drop stack.
   */
  public toString(): string {
    return Array.from(this.#dropCounts.entries())
      .map(([itemId, count]) => {
        const item = this.getItemFromId(itemId);
        if (item) {
          return `${item.sName} (${count})`;
        }

        return "";
      })
      .join(", ");
  }

  /**
   * Retrieves the item data store.
   */
  public get itemData(): ReadonlyMap<number, ItemData> {
    return this.#itemData;
  }

  /**
   * Retrieves item data using its ID.
   *
   * @param itemId - The ID of the item.
   * @returns The item data if found, null otherwise.
   */
  public getItemFromId(itemId: number): ItemData | null {
    return this.#itemData.get(itemId) ?? null;
  }

  /**
   * Retrieves item data using its name (case-insensitive).
   *
   * @param itemName - The name of the item.
   * @returns The item data if found, null otherwise.
   */
  public getItemFromName(itemName: string): ItemData | null {
    const normalizedName = itemName.toLowerCase();

    for (const item of this.#itemData.values()) {
      if (item.sName.toLowerCase() === normalizedName) {
        return item;
      }
    }

    return null;
  }

  /**
   * Retrieves the name of an item using its ID.
   *
   * @param itemId - The ID of the item.
   * @returns The name of the item if found, null otherwise.
   */
  public getItemName(itemId: number): string | null {
    return this.getItemFromId(itemId)?.sName ?? null;
  }

  /**
   * Retrieves the ID of an item using its name.
   *
   * @param itemName - The name of the item.
   * @returns The ID of the item if found, null otherwise.
   */
  public getItemId(itemName: string): number | null {
    return this.getItemFromName(itemName)?.ItemID ?? null;
  }

  /**
   * Retrieves the count of an item in the drop stack.
   *
   * @param itemId - The ID of the item.
   * @returns The count of the item in the drop stack, or -1 if not found.
   */
  public getDropCount(itemId: number): number {
    return this.#dropCounts.get(itemId) ?? -1;
  }

  /**
   * Adds an item to the internal store and the stack as visible to the client.
   *
   * @param item - The item that was dropped.
   */
  public addDrop(item: ItemData): void {
    if (!this.#itemData.has(item.ItemID)) {
      this.#itemData.set(item.ItemID, { ...item });
    }

    const count = this.getDropCount(item.ItemID);
    this.#dropCounts.set(
      item.ItemID,
      count === -1 ? item.iQty : count + item.iQty,
    );
  }

  /**
   * Adds multiple items to the drop stack at once.
   *
   * @param items - Array of ItemData to add.
   */
  public addDrops(items: ItemData[]): void {
    for (const item of items) this.addDrop(item);
  }

  /**
   * Accepts the drop for an item in the stack.
   *
   * @param item - The name or ID of the item.
   * @returns Whether the pickup was successful.
   */
  public async pickup(item: number | string): Promise<boolean> {
    const itemData = this.#resolveItem(item);
    if (!itemData || this.getDropCount(itemData.ItemID) <= 0) return false;

    const { ItemID: itemId } = itemData;

    if (this.bot.player.isReady() && itemData) {
      this.bot.flash.call(() => swf.dropStackAcceptDrop(itemId));

      // this.bot.packets.sendServer(
      //   `%xt%zm%getDrop%${this.bot.world.roomId}%${itemId}%`,
      // );

      const res = await this.bot.waitUntil(
        () =>
          this.bot.player.isReady() && this.bot.inventory.get(item) !== null,
        { timeout: 5_000 },
      );

      if (res.isErr() && res.error === "timeout") {
        // TODO: logger
        console.debug(
          `Timeout while waiting for item pickup: ${item} (ID: ${itemId})`,
        );
      }

      this.#removeDrop(itemId);
      return true;
    }

    return false;
  }

  /**
   * Rejects a drop from the stack.
   *
   * @param itemKey - The name or ID of the item.
   * @param removeFromStore - Whether to delete the item entry from the store.
   * @returns Whether the rejection was successful.
   */
  public async reject(
    itemKey: number | string,
    removeFromStore: boolean = false,
  ): Promise<boolean> {
    if (typeof itemKey !== "string" && typeof itemKey !== "number")
      return false;

    const item = this.#resolveItem(itemKey);
    if (!item) {
      return false;
    }

    this.bot.flash.call(() => swf.dropStackRejectDrop(item.ItemID));

    if (removeFromStore) {
      this.#removeDrop(item.ItemID);
    }

    return true;
  }

  /**
   * Checks if an item exists in the drop stack.
   *
   * @param itemKey - The name or ID of the item.
   */
  public hasDrop(itemKey: number | string): boolean {
    const item = this.#resolveItem(itemKey);
    return item !== null && this.getDropCount(item.ItemID) > 0;
  }

  #removeDrop(itemId: number): void {
    this.#dropCounts.delete(itemId);
  }

  /**
   * Resolves for an item using its name or ID.
   *
   * @param key - The name or ID of the item.
   * @returns The item data if found, null otherwise.
   */
  #resolveItem(key: number | string): ItemData | null {
    if (typeof key === "string") {
      return this.getItemFromName(key);
    } else if (typeof key === "number") {
      return this.getItemFromId(key);
    }

    return null;
  }
}
