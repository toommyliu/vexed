import type { Bot } from "./Bot";
import { ServerPacket } from "./Packets";
import { GameAction } from "./World";
import { InventoryItem } from "./models/InventoryItem";
import type { ItemData } from "./models/Item";

export class Inventory {
  public constructor(public readonly bot: Bot) {}

  /**
   * Gets items in the Inventory of the current player.
   */
  public get items(): InventoryItem[] {
    return this.bot.flash
      .call<unknown[]>(() => swf.inventoryGetItems())
      .map((data) => new InventoryItem(data as unknown as ItemData));
  }

  /**
   * Resolves for an Item in the Inventory.
   *
   * @param key - The name or ID of the item.
   */
  public get(key: number | string): InventoryItem | null {
    return this.bot.flash.call(() => {
      const item = swf.inventoryGetItem(key);
      if (!item) return null;

      return new InventoryItem(item);
    });
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
    return this.bot.flash.call(() => swf.inventoryGetSlots());
  }

  /**
   * The number of used slots in the player's inventory.
   */
  public get usedSlots(): number {
    return this.bot.flash.call(() => swf.inventoryGetUsedSlots());
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

    await this.bot.waitUntil(
      () =>
        this.bot.player.isReady() && Boolean(this.get(itemKey)?.isEquipped()),
      { timeout: 5_000 },
    );

    // Make sure we are wearing the item after equipping (this doesn't seem to work...)
    this.bot.packets.sendServer(
      `%xt%zm%wearItem%${this.bot.world.roomId}%${item.data.ItemID}%`,
      ServerPacket.String,
    );
  }
}
