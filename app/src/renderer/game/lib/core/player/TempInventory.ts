import { Item, type ItemData } from "@vexed/game";
import type { Bot } from "../Bot";
import { ItemContainer } from "./ItemContainer";

export class TempInventory extends ItemContainer<Item> {
  public constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Returns all items in the temp inventory.
   */
  public all(): Item[] {
    return this.bot.flash
      .getWithDefault<ItemData[]>("world.myAvatar.tempitems", [])
      .map((item) => new Item(item));
  }

  /**
   * Gets a temp inventory item.
   *
   * @param key - The name or ID of the item.
   */
  public get(key: number | string): Item | undefined {
    const data = this.bot.flash.call<any | null>(() =>
      swf.tempInventoryGetItem(key),
    );
    return data ? new Item(data) : undefined;
  }

  /**
   * Whether an item meets the quantity in the temp inventory.
   *
   * @param key - The name or ID of the item.
   * @param quantity - The quantity of the item.
   */
  public contains(key: number | string, quantity: number = 1): boolean {
    return this.bot.flash.call(() => swf.tempInventoryContains(key, quantity));
  }

  /**
   * Temp inventory does not have slots.
   */
  public readonly totalSlots = 0;

  /**
   * The number of used slots in the temp inventory.
   */
  public get usedSlots(): number {
    return this.all().length;
  }
}
