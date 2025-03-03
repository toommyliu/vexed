import type { Bot } from './Bot';
import { HouseItem } from './models/HouseItem';
import type { ItemData } from './models/Item';

export class House {
  public constructor(public readonly bot: Bot) {}

  /**
   * Gets house items of the current player.
   */
  public get items(): HouseItem[] {
    return this.bot.flash.call(() =>
      swf.houseGetItems().map((data: ItemData) => new HouseItem(data)),
    );
  }

  public get(key: number | string): HouseItem | null {
    return this.bot.flash.call(() => {
      const item = swf.houseGetItem(key);
      if (!item) return null;

      return new HouseItem(item);
    });
  }

  /**
   * Gets the total number of house item slots.
   */
  public get totalSlots(): number {
    return this.bot.flash.call(() => swf.houseGetSlots());
  }
}
