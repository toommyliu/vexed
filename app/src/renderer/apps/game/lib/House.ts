import { Item, type ItemData } from "@vexed/game";
import type { Bot } from "./Bot";

export class House {
  public constructor(public readonly bot: Bot) {}

  /**
   * Gets house items of the current player.
   */
  public get items(): Item[] {
    return this.bot.flash.call(() =>
      swf.houseGetItems().map((data: ItemData) => new Item(data)),
    );
  }

  public get(key: number | string): Item | null {
    return this.bot.flash.call(() => {
      const item = swf.houseGetItem(key);
      if (!item) return null;
      return new Item(item);
    });
  }

  /**
   * Gets the total number of house item slots.
   */
  public get totalSlots(): number {
    return this.bot.flash.call(() => swf.houseGetSlots());
  }
}
