import { Item, type ItemData } from "@vexed/game";
import type { Bot } from "../Bot";
import { ItemContainer } from "./ItemContainer";

export class House extends ItemContainer<Item> {
  public constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Returns all house items.
   */
  public all(): Item[] {
    return this.bot.flash
      .getWithDefault("world.myAvatar.houseitems", [])
      .map((item) => new Item(item));
  }

  /**
   * Gets a house item.
   *
   * @param key - The name or ID of the item.
   */
  public get(key: number | string): Item | undefined {
    const data = this.bot.flash.call<ItemData | null>(() =>
      swf.houseGetItem(key),
    );
    return data ? new Item(data) : undefined;
  }

  /**
   * Whether an item meets the quantity in the house.
   *
   * @param key - The name or ID of the item.
   * @param quantity - The quantity of the item.
   */
  public contains(key: number | string, quantity: number = 1): boolean {
    return this.bot.flash.call(() => swf.houseContains(key, quantity));
  }

  /**
   * Gets the total number of house item slots.
   */
  public get totalSlots(): number {
    return this.bot.flash.getWithDefault(
      "world.myAvatar.objData.iHouseSlots",
      0,
    );
  }

  /**
   * Gets the number of house item slots currently in use.
   */
  public get usedSlots(): number {
    return this.all().length;
  }
}
