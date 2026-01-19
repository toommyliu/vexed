import type { Item } from "@vexed/game";
import type { Bot } from "../Bot";

export abstract class ItemContainer<T extends Item> {
  public constructor(public readonly bot: Bot) {}

  /**
   * Returns all items in the container.
   */
  public abstract all(): T[];

  /**
   * Gets an item from the container.
   *
   * @param key - The name or ID of the item.
   */
  public abstract get(key: number | string): T | undefined;

  /**
   * Whether an item meets the quantity in the container.
   *
   * @param key - The name or ID of the item.
   * @param quantity - The quantity of the item.
   */
  public abstract contains(key: number | string, quantity?: number): boolean;

  /**
   * The total slots available in the container.
   */
  public abstract get totalSlots(): number;

  /**
   * The number of used slots in the container.
   */
  public abstract get usedSlots(): number;

  /**
   * The number of available slots in the container.
   */
  public get availableSlots(): number {
    return this.totalSlots - this.usedSlots;
  }
}
