import { Mutex } from "async-mutex";
import type { Bot } from "./Bot";
import type { ItemData } from "./models/Item";

export class Drops {
  readonly #mutex = new Mutex();

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
    // const result: Record<number, number> = {};
    // for (const [key, value] of this.#dropCounts.entries()) {
    //   // const item = this.getItemFromId(key);
    //   // console.log(`${item?.sName} - ${value}`);
    //   result[key] = value;
    // }

    return Object.freeze(this.#dropCounts);
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
    return Object.freeze(this.#itemData);
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
    // console.log(
    // `Adding drop: ${item.sName} (${item.ItemID}) [${typeof item.sName} : ${typeof item.ItemID}]`,
    // );
    if (!this.#itemData.has(item.ItemID)) {
      this.#itemData.set(item.ItemID, Object.freeze({ ...item }));
    }

    const count = this.getDropCount(item.ItemID);
    this.#dropCounts.set(
      item.ItemID,
      count === -1 ? item.iQty : count + item.iQty,
    );
    // console.log(
    // `${item.sName} (${item.ItemID}) added to drop stack, now at ${this.#dropCounts.get(item.ItemID)}`,
    // );
  }

  /**
   * Accepts the drop for an item in the stack.
   *
   * @param item - The name or ID of the item.
   */
  public async pickup(item: number | string): Promise<void> {
    const itemData = this.#resolveItem(item);
    if (!itemData || this.getDropCount(itemData.ItemID) <= 0) {
      // console.log("Item not found in drop stack (1)", item);
      return;
    }

    // console.log(`Pickup item: ${itemData.sName} (${itemData.ItemID})`);

    // if (this.isUsingCustomUi() && !this.isCustomUiOpen()) {
    //   console.log("Set custom drops ui open (1)");
    //   this.setCustomDropsUiOpen(true);
    // }

    const { ItemID: itemId } = itemData;
    return this.#mutex.runExclusive(async () => {
      if (!this.bot.player.isReady()) return;

      this.bot.packets.sendServer(
        `%xt%zm%getDrop%${this.bot.world.roomId}%${itemId}%`,
      );
      await this.bot.waitUntil(
        () => this.bot.inventory.get(item) !== null,
        () => this.bot.player.isReady(),
        -1,
      );
      this.#removeDrop(itemId);
    });
  }

  /**
   * Rejects a drop from the stack.
   *
   * @param itemKey - The name or ID of the item.
   * @param removeFromStore - Whether to delete the item entry from the store.
   */
  public async reject(
    itemKey: number | string,
    removeFromStore: boolean = false,
  ) {
    const item = this.#resolveItem(itemKey);
    if (!item) {
      return;
    }

    // if (this.isUsingCustomUi() && !this.isCustomUiOpen()) {
    //   console.log("Set custom drops ui open (2)");
    //   this.setCustomDropsUiOpen(true);
    // }

    // console.log("Rejecting drop", item.sName, item.ItemID);

    this.bot.flash.call(() =>
      swf.dropStackRejectDrop(item.sName, item.ItemID.toString()),
    );

    if (removeFromStore) {
      this.#removeDrop(item.ItemID);
    }
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

  // /**
  //  * Whether the player is using the custom drops ui.
  //  */
  // public isUsingCustomUi(): boolean {
  //   return this.bot.flash.call<boolean>(() =>
  //     swf.dropStackIsUsingCustomDrops(),
  //   );
  // }

  // /**
  //  * Whether the custom drops ui is open.
  //  */
  // public isCustomUiOpen(): boolean {
  //   return this.bot.flash.call<boolean>(() =>
  //     swf.dropStackIsCustomDropsUiOpen(),
  //   );
  // }

  // /**
  //  * Sets the custom drops ui state.
  //  *
  //  * @param on - Whether to use the custom drops ui.
  //  * @param draggable - Whether to use the draggable custom drops ui.
  //  */
  // public setCustomDropsUi(on: boolean, draggable: boolean): void {
  //   this.bot.flash.call(() =>
  //     swf.dropStackSetCustomDropsUiState(on, draggable),
  //   );
  // }

  // /**
  //  * Sets the custom drops ui open state.
  //  *
  //  * @param on - Whether to open the custom drops ui.
  //  */
  // public setCustomDropsUiOpen(on: boolean): void {
  //   this.bot.flash.call(() => swf.dropStackSetCustomDropsUiOpen(on));
  // }

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
