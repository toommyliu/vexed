import { Collection } from "@vexed/collection";
import type { AddItemsPacket, LoadInventoryBigPacket } from "../packet-handlers/json";
import type { Bot } from "./Bot";
import { ServerPacket } from "./Packets";
import { GameAction } from "./World";
import { InventoryItem } from "./models/InventoryItem";
import type { ItemData } from "./models/Item";

export class Inventory {
  #items = new Collection<number, InventoryItem>();
  #totalSlots = 0;
  #className = "";

  public constructor(public readonly bot: Bot) { }

  /**
   * @internal
   * Handles loadInventoryBig packet for initial inventory load.
   */
  public _handleLoadInventoryBig(packet: LoadInventoryBigPacket): void {
    this.#items.clear();

    if (packet.iSlots) {
      this.#totalSlots = packet.iSlots;
    }

    for (const itemData of packet.items) {
      const item = new InventoryItem(itemData);
      this.#items.set(item.id, item);

      if (item.category === "Class" && itemData.bEquip === 1) {
        this.#className = item.name;
      }
    }
  }

  /**
   * @internal
   * Handles addItems packets to update local inventory state.
   */
  public _handleAddItems(packet: AddItemsPacket): void {
    for (const [, itemData] of Object.entries(packet.items)) {
      const item = new InventoryItem(itemData as ItemData);

      if (item.category === "Class" && itemData.bEquip === 1) {
        this.#className = item.name;
      }

      if (itemData.CharItemID) {
        this.#items.set(item.id, item);
      }
    }
  }

  /**
   * @internal
   * Handles item removal (e.g., from turnIn, sellItem).
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
   * Handles equipping an item, tracking class name if applicable.
   */
  public _handleEquip(itemId: number): void {
    const item = this.#items.get(itemId);
    if (!item) return;

    item.data.bEquip = 1;

    if (item.category === "Class") {
      this.#className = item.name;
    }
  }

  /**
   * @internal
   * Clears local inventory state (e.g., on logout).
   */
  public _clear(): void {
    this.#items.clear();
    this.#className = "";
  }

  /**
   * @internal
   * Sets total inventory slots from initial data.
   */
  public _setTotalSlots(slots: number): void {
    this.#totalSlots = slots;
  }

  /**
   * The currently equipped class name.
   */
  public get className(): string {
    return this.#className;
  }

  /**
   * The collection of items in the Inventory.
   */
  public get items(): Collection<number, InventoryItem> {
    return this.#items;
  }

  /**
   * Resolves for an Item in the Inventory.
   *
   * @param key - The name or ID of the item.
   */
  public get(key: number | string): InventoryItem | null {
    if (typeof key === "number") {
      return this.#items.get(key) ?? null;
    }

    const lowerKey = key.toLowerCase();
    return (
      this.#items.find((item) => item.name.toLowerCase() === lowerKey) ?? null
    );
  }

  /**
   * Whether an item meets the quantity in the inventory.
   *
   * @remarks If the item is a Class, the quantity is ignored.
   * @param itemKey - The name or ID of the item.
   * @param quantity - The quantity of the item.
   */
  public contains(itemKey: number | string, quantity: number = 1): boolean {
    const item = this.get(itemKey);
    return (
      item !== null && (item.quantity >= quantity || item.category === "Class")
    );
  }

  /**
   * The total slots available in the player's inventory.
   */
  public get totalSlots(): number {
    return this.#totalSlots;
  }

  /**
   * The number of used slots in the player's inventory.
   */
  public get usedSlots(): number {
    return this.#items.size;
  }

  /**
   * The number of available slots in the player's inventory.
   */
  public get availableSlots(): number {
    return this.totalSlots - this.usedSlots;
  }

  /**
   * Equips an item from the inventory.
   *
   * @param itemKey - The name or ID of the item.
   */
  public async equip(itemKey: number | string): Promise<void> {
    const item = this.get(itemKey);

    if (!item || item.isEquipped()) return;

    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.EquipItem),
    );

    this.bot.flash.call(() => swf.inventoryEquip(itemKey));
    this._handleEquip(item.id);

    await this.bot.waitUntil(
      () =>
        this.bot.player.isReady() && Boolean(this.get(itemKey)?.isEquipped()),
      { timeout: 5_000 },
    );

    this.bot.packets.sendServer(
      `%xt%zm%wearItem%${this.bot.world.roomId}%${item.data.ItemID}%`,
      ServerPacket.String,
    );
  }
}
