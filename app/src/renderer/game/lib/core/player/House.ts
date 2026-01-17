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

  public get(key: number | string) {
    if (typeof key === "number") return this.items.get(key);
    if (typeof key === "string") return this.items.getByName(key);
    return undefined;
  }

  /**
   * Gets the total number of house item slots.
   */
  public get totalSlots(): number {
    return this.bot.flash.getWithDefault(
      "world.myAvatar.objData.iHouseSlots",
      0,
      true,
    );
  }

  /**
   * Gets the number of house item slots currently in use.
   */
  public get usedSlots(): number {
    return this.items.all().size;
  }

  /**
   * Gets the number of available house item slots.
   */
  public get availableSlots(): number {
    return this.totalSlots - this.usedSlots;
  }
}
