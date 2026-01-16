import { GameAction } from "@vexed/game";
import { inventory } from "~/lib/stores/inventory";
import type { Bot } from "../Bot";
import { ServerPacket } from "../Packets";

export class Inventory {
  public constructor(public readonly bot: Bot) {}

  /**
   * All items in the player's inventory.
   */
  public get items() {
    return inventory;
  }

  /**
   * Resolves for an Item in the Inventory.
   *
   * @param key - The name or ID of the item.
   */
  public get(key: number | string) {
    if (typeof key === "number") return this.items.getById(key);
    if (typeof key === "string") return this.items.getByName(key);
    return undefined;
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
      item !== undefined &&
      (item.quantity >= quantity || item.category === "Class")
    );
  }

  /**
   * The total slots available in the player's inventory.
   */
  public get totalSlots(): number {
    return this.bot.flash.getWithDefault<number>(
      "world.myAvatar.objData.iBagSlots",
      0,
      true,
    );
  }

  /**
   * The number of used slots in the player's inventory.
   */
  public get usedSlots(): number {
    return this.items.all().size;
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
   * @param key - The name or ID of the item.
   */
  public async equip(
    key: number | string,
    { wear }: { wear?: boolean } = {},
  ): Promise<void> {
    const item = this.get(key);
    if (!item) return;

    const shouldEquip =
      item.isEquipped() || (item.isMember() && !this.bot.player.isMember());
    if (!shouldEquip) return;

    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.EquipItem),
    );

    const obj = {
      ItemID: item.id,
    };

    if (item.data.sType === "Item") {
      // consumable
      this.bot.flash.call("world.equipUseableItem", {
        ...obj,
        sDesc: item.data.sDesc,
        sFile: item.data.sFile,
        sName: item.name,
      });
    } else {
      this.bot.flash.call("world.sendEquipItemRequest", obj);
    }

    await this.bot.waitUntil(
      () => this.bot.player.isReady() && Boolean(this.get(key)?.isEquipped()),
      { timeout: 3_000 },
    );

    if (wear) {
      this.bot.packets.sendServer(
        `%xt%zm%wearItem%${this.bot.world.roomId}%${item.id}%`,
        ServerPacket.String,
      );
    }
  }
}
