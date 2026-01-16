import type { ShopItemData } from "../types/ShopItemData";
import { Item } from "./Item";

/**
 * Represents an item in the shop.
 */
export class ShopItem extends Item {
  public constructor(public override data: ShopItemData) {
    super(data);
  }
}
