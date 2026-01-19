import { Item } from "./Item";
import type { ShopItemData } from "../types/ShopItemData";

export class ShopItem extends Item {
  public constructor(public data: ShopItemData) {
    super(data);
  }
}
