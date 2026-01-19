import { GameAction, Item, type ItemData } from "@vexed/game";
import type { Bot } from "../Bot";
import { ServerPacket } from "../Packets";
import { ItemContainer } from "./ItemContainer";

export class Inventory extends ItemContainer<Item> {
  public constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Returns all items in the player's inventory.
   */
  public all(): Item[] {
    return this.bot.flash
      .getWithDefault<ItemData[]>("world.myAvatar.items", [])
      .map((item) => new Item(item));
  }

  /**
   * Gets an item from the inventory.
   *
   * @param key - The name or ID of the item.
   */
  public get(key: number | string): Item | undefined {
    const data = this.bot.flash.call<any | null>(() =>
      swf.inventoryGetItem(key),
    );
    return data ? new Item(data) : undefined;
  }

  /**
   * Whether an item meets the quantity in the inventory.
   *
   * @remarks If the item is a Class, the quantity is ignored.
   * @param key - The name or ID of the item.
   * @param quantity - The quantity of the item.
   */
  public contains(key: number | string, quantity: number = 1): boolean {
    return this.bot.flash.call(() => swf.inventoryContains(key, quantity));
  }

  /**
   * The total slots available in the player's inventory.
   */
  public get totalSlots(): number {
    return this.bot.flash.getWithDefault<number>(
      "world.myAvatar.objData.iBagSlots",
      0,
    );
  }

  /**
   * The number of used slots in the player's inventory.
   */
  public get usedSlots(): number {
    return this.bot.flash.getWithDefault("world.myAvatar.items.length", 0);
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
