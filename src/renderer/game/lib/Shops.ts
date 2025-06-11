import type { Bot } from "./Bot";
import { GameAction } from "./World";
import type { ShopItemData } from "./models/ShopItem";

export class Shops {
  public constructor(public bot: Bot) {}

  /**
   * Whether any shop is loaded.
   */
  public isShopLoaded(): boolean {
    return this.info !== null;
  }

  /**
   * The info about the current loaded shop.
   */
  public get info(): ShopInfo | null {
    return this.bot.flash.get("world.shopinfo", true);
  }

  /**
   * Buy an item from the shop.
   *
   * @param itemName - The name of the item.
   * @param quantity - The quantity of the item. If not provided, it will default to 1.
   */
  public async buyByName(
    itemName: string,
    quantity: number | null,
  ): Promise<void> {
    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.BuyItem),
    );

    const qty = quantity ?? 1;
    this.bot.flash.call(() => swf.shopBuyByName(itemName, qty));

    await this.bot.waitUntil(() => this.bot.inventory.contains(itemName, qty));
  }

  /**
   * Buy an item from the shop.
   *
   * @param itemId - The id of the item.
   * @param quantity -The quantity of the item.
   */
  public async buyById(itemId: number, quantity: number): Promise<void> {
    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.BuyItem),
    );

    if (!this.isShopLoaded()) return;

    const item = this.info!.items.find(
      (shopItem) => shopItem.ItemID === itemId,
    );
    if (!item) return;

    this.bot.flash.call(() => swf.shopBuyById(itemId, quantity));

    await this.bot.waitUntil(() =>
      this.bot.inventory.contains(itemId, quantity),
    );
  }

  /**
   * Load a shop.
   *
   * @param shopId - The shop ID.
   */
  public async load(shopId: number | string): Promise<void> {
    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.LoadShop),
    );
    this.bot.flash.call(() =>
      swf.shopLoad(Number.parseInt(String(shopId), 10)),
    );
    await this.bot.waitUntil(() => this.isShopLoaded());
  }

  /**
   * Sells an entire stack of an item.
   *
   * @param key - The name or ID of the item.
   */
  public async sell(key: string): Promise<void> {
    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.SellItem),
    );

    const item = this.bot.inventory.get(key);

    if (!item) return;

    await this.bot.sleep(1_000);
    this.bot.flash.call(() => swf.shopSellByName(item.name));
    await this.bot.waitUntil(() => !this.bot.inventory.get(key));
  }

  /**
   * Loads a hair shop.
   *
   * @param shopId - The shop ID.
   */
  public loadHairShop(shopId: number | string): void {
    this.bot.flash.call(() =>
      swf.shopLoadHairShop(Number.parseInt(String(shopId), 10)),
    );
  }

  /**
   * Opens the Armor Customization menu.
   */
  public openArmorCustomizer(): void {
    this.bot.flash.call(() => swf.shopLoadArmorCustomize());
  }
}

export type ShopInfo = {
  Location: string;
  ShopID: string;
  bHouse: string;
  bStaff: string;
  bUpgrd: string;
  iIndex: string;
  items: ShopItemData[];
  sField: string;
  sName: string;
};
