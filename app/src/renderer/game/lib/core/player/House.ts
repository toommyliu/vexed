import { HouseItem } from "@vexed/game";
import { house } from "~/lib/stores/house";
import type { Bot } from "../Bot";

export class House {
  public constructor(public readonly bot: Bot) {}

  /**
   * The player's current house items.
   */
  public get items() {
    return house;
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
