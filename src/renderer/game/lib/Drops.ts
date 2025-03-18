import { Mutex } from 'async-mutex';
import type { Bot } from './Bot';
import type { ItemData } from './models/Item';

export class Drops {
  private readonly mutex = new Mutex();

  /**
   * A map of item IDs to their associated item data.
   */
  private readonly items = new Map<number, ItemData>();

  /**
   * A map of item IDs to their count in the drop stack.
   */
  private drops = new Map<number, number>();

  public constructor(public readonly bot: Bot) {}

  /**
   * The drop stack as shown to the client. The mapping is of the form `itemID -> count`.
   */
  public get stack(): Record<number, number> {
    const result: Record<number, number> = {};
    for (const [key, value] of this.drops.entries()) {
      result[key] = value;
    }

    return Object.freeze(result);
  }

  /**
   * Retrieves item data using its ID.
   *
   * @param itemId - The ID of the item.
   * @returns The item data if found, null otherwise.
   */
  public getItemFromId(itemId: number): ItemData | null {
    const item = this.items.get(itemId);
    return item ? Object.freeze(item) : null;
  }

  /**
   * Retrieves item data using its name (case-insensitive).
   *
   * @param itemName - The name of the item.
   * @returns The item data if found, null otherwise.
   */
  public getItemFromName(itemName: string): ItemData | null {
    const normalizedName = itemName.toLowerCase();
    const item = Array.from(this.items.values()).find(
      (item) => item.sName.toLowerCase() === normalizedName,
    );

    return item ? Object.freeze({ ...item }) : null;
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
    return this.drops.get(itemId) ?? -1;
  }

  /**
   * Adds an item to the internal store and the stack as visible to the client.
   *
   * @param item - The item that was dropped.
   */
  public addDrop(item: ItemData): void {
    if (!this.items.has(item.ItemID)) {
      this.items.set(item.ItemID, { ...item });
    }

    const count = this.getDropCount(item.ItemID);
    this.drops.set(item.ItemID, count === -1 ? item.iQty : count + item.iQty);
  }

  /**
   * Accepts the drop for an item in the stack.
   *
   * @param itemKey - The name or ID of the item.
   */
  public async pickup(itemKey: number | string): Promise<void> {
    const item = this.resolveItem(itemKey);
    if (!item || this.getDropCount(item.ItemID) <= 0) {
      return;
    }

    if (this.isUsingCustomUi() && !this.isCustomUiOpen()) {
      this.setCustomDropsUi(true);
    }

    const { ItemID: itemId } = item;
    return this.mutex.runExclusive(async () => {
      this.bot.packets.sendServer(
        `%xt%zm%getDrop%${this.bot.world.roomId}%${itemId}%`,
      );
      this.removeDrop(itemId);
      await this.bot.waitUntil(
        () => this.bot.inventory.get(itemKey) !== null,
        () => this.bot.player.isReady(),
        -1,
      );
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
    const item = this.resolveItem(itemKey);
    if (!item) return;

    if (this.isUsingCustomUi() && !this.isCustomUiOpen()) {
      this.setCustomDropsUi(true);
    }

    this.bot.flash.call(() => swf.dropStackRejectDrop(item.sName, item.ItemID));

    if (removeFromStore) {
      this.removeDrop(item.ItemID);
    }
  }

  /**
   * Checks if an item exists in the drop stack.
   *
   * @param itemKey - The name or ID of the item.
   */
  public hasDrop(itemKey: number | string): boolean {
    const item = this.resolveItem(itemKey);
    return item !== null && this.getDropCount(item.ItemID) > 0;
  }

  /**
   * Whether the player is using the custom drops ui.
   */
  public isUsingCustomUi(): boolean {
    return this.bot.flash.call<boolean>(() =>
      swf.dropStackIsUsingCustomDrops(),
    );
  }

  /**
   * Whether the custom drops ui is open.
   */
  public isCustomUiOpen(): boolean {
    return this.bot.flash.call<boolean>(() =>
      swf.dropStackIsCustomDropsUiOpen(),
    );
  }

  /**
   * Sets the custom drops ui state.
   *
   * @param on - Whether to use the custom drops ui.
   */
  public setCustomDropsUi(on: boolean): void {
    this.bot.flash.call(() => swf.dropStackSetCustomDropsUiState(on));
  }

  private removeDrop(itemId: number): void {
    this.drops.delete(itemId);
  }

  private resolveItem(itemKey: number | string): ItemData | null {
    if (typeof itemKey === 'string') {
      return this.getItemFromName(itemKey);
    } else if (typeof itemKey === 'number') {
      return this.getItemFromId(itemKey);
    }

    return null;
  }
}
