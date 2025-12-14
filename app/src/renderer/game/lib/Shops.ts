import { number } from "@/shared/number";
import type { LoadShopPacket } from "../packet-handlers/json";
import type { Bot } from "./Bot";
import { GameAction } from "./World";
import { ShopItem, type ShopItemData } from "./models/ShopItem";

export class Shops {
  #shopInfo: ShopInfo | null = null;

  public constructor(public bot: Bot) { }

  /**
   * @internal
   * Handles loadShop packets to cache shop data.
   */
  public _handleLoadShop(packet: LoadShopPacket): void {
    this.#shopInfo = {
      ShopID: String(packet.shopinfo.ShopID),
      sName: packet.shopinfo.sName,
      sField: packet.shopinfo.sField ?? "",
      items: packet.shopinfo.items as unknown as ShopItemData[],
      Location: "",
      bHouse: "0",
      bStaff: "0",
      bUpgrd: "0",
      iIndex: "0",
    };
  }

  /**
   * @internal
   * Clears cached shop data (e.g., on map change).
   */
  public _clear(): void {
    this.#shopInfo = null;
  }

  /**
   * Whether any shop is loaded.
   */
  public get loaded(): boolean {
    return this.info !== null;
  }

  /**
   * The info about the current loaded shop.
   */
  public get info(): ShopInfo | null {
    return this.#shopInfo;
  }

  /**
   * Whether the shop is a merge shop.
   */
  public get isMergeShop(): boolean {
    return this.bot.flash.call(() => swf.shopIsMergeShop());
  }

  /**
   * Get a shop item by its name.
   *
   * @param itemName - The name of the item.
   */
  public getByName(itemName: string): ShopItem | null {
    if (!this.loaded) return null;

    const item = this.info!.items.find(
      (shopItem) => shopItem.sName.toLowerCase() === itemName.toLowerCase(),
    );

    if (item) return new ShopItem(item);
    return null;
  }

  /**
   * Get a shop item by its item ID.
   *
   * @param itemId - The ID of the item.
   */
  public getById(itemId: number): ShopItem | null {
    if (!this.loaded) return null;

    const item = this.info!.items.find(
      (shopItem) => shopItem.ItemID === itemId,
    );

    if (item) return new ShopItem(item);
    return null;
  }

  /**
   * Buy an item from the shop.
   *
   * @param itemName - The name of the item.
   * @param quantity - The quantity of the item. Defaults to 1.
   */
  public async buyByName(
    itemName: string,
    quantity: number | null,
  ): Promise<void> {
    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.BuyItem),
    );

    if (!this.loaded) return;

    const item = this.info!.items.find(
      (shopItem) => shopItem.sName.toLowerCase() === itemName.toLowerCase(),
    );
    if (!item || !this.bot.shops.canBuyItem(item?.sName)) {
      return;
    }

    const qty = quantity ?? 1;

    this.bot.flash.call(() => swf.shopBuyByName(itemName, qty));
    await this.bot.waitUntil(() => this.bot.player.inventory.contains(itemName));
  }

  /**
   * Buy an item from the shop.
   *
   * @param itemId - The id of the item.
   * @param quantity - The quantity of the item.
   */
  public async buyById(itemId: number, quantity: number): Promise<void> {
    if (!this.loaded) return;

    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.BuyItem),
    );

    const item = this.info!.items.find(
      (shopItem) => shopItem.ItemID === itemId,
    );
    if (!item || !this.bot.shops.canBuyItem(item?.sName)) return;

    let qty = quantity;

    if (item.iQty > 1) {
      qty = Math.ceil(qty / item.iQty);
    }

    this.bot.flash.call(() => swf.shopBuyById(itemId, qty));

    const expectedQuantity = qty * item.iQty;
    await this.bot.waitUntil(() =>
      this.bot.player.inventory.contains(itemId, expectedQuantity),
    );
  }

  /**
   * Load a shop.
   *
   * @param shopId - The shop ID.
   */
  public async load(shopId: number | string): Promise<void> {
    const id = number(shopId);
    if (!id) return;

    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.LoadShop),
    );

    this.bot.flash.call(() => swf.shopLoad(id));
    await this.bot.waitUntil(() => this.loaded);
  }

  /**
   * Sells an entire stack of an item.
   *
   * @param item - The name or ID of the item.
   */
  public async sell(item: string): Promise<void> {
    const obj = this.bot.player.inventory.get(item);
    if (!obj) return;

    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.SellItem),
    );

    await this.bot.sleep(1_000);
    this.bot.flash.call(() => swf.shopSellByName(obj.name));
    await this.bot.waitUntil(() => !this.bot.player.inventory.contains(obj.name));
  }

  /**
   * Loads a hair shop.
   *
   * @param shopId - The shop ID.
   */
  public loadHairShop(shopId: number | string): void {
    const id = number(shopId);
    if (!id) return;

    this.bot.flash.call(() => swf.shopLoadHairShop(id));
  }

  /**
   * Opens the Armor Customization menu.
   */
  public openArmorCustomizer(): void {
    this.bot.flash.call(() => swf.shopLoadArmorCustomize());
  }

  /**
   * Whether an item can be bought from the shop.
   *
   * @param itemName - The name of the item.
   */
  public canBuyItem(itemName: string): boolean {
    return this.bot.flash.call<boolean>(() => swf.shopCanBuyItem(itemName));
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
