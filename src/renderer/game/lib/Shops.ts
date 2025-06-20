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

  /**
   * Whether an item can be purchased from the shop.
   */
  public canBuy(itemName: string): boolean {
    if (!this.isShopLoaded()) return false;

    const shopItem = this.info!.items.find(
      (item) => item.sName.toLowerCase() === itemName.toLowerCase(),
    );
    if (!shopItem) return false;

    const shopInfo = this.info!;

    // TODO: implement in as3
    // if (
    //   shopItem.bStaff === "1" &&
    //   this.bot.flash.get("world.myAvatar.objData.intAccessLevel", true) < 40
    // ) {
    //   // Don't know
    //   return false;
    // } else if (
    //   shopInfo.sField !== "" &&
    //   this.bot.flash.call(
    //     "world.getAchievement",
    //     shopInfo.sField,
    //     shopInfo.iIndex,
    //   ) !== 1
    // ) {
    //   // NostalgiaQuest
    //   return false;
    // } else if (shopItem.bUpg === "1" && !this.bot.player.isMember()) {
    //   return false;
    // } else if (
    //   typeof shopItem.FactionID === "string" &&
    //   Number(shopItem.FactionID) > 1 &&
    //   this.bot.player.factions.find(
    //     (fct) => fct.data.FactionID === shopItem.FactionID,
    //   )?.data?.iRep < Number(shopItem.iReqRep)
    // ) {
    //   return false;
    // } else if (

    // )

    // if (param1.bStaff == 1 && myAvatar.objData.intAccessLevel < 40) {
    //   rootClass.MsgBox.notify("Test Item: Cannot be purchased yet!");
    // } else if (
    //   shopinfo.sField != "" &&
    //   getAchievement(shopinfo.sField, shopinfo.iIndex) != 1
    // ) {
    //   rootClass.MsgBox.notify("Item Locked: Special requirement not met.");
    // } else if (param1.bUpg == 1 && !myAvatar.isUpgraded()) {
    //   rootClass.showUpgradeWindow();
    // } else if (
    //   param1.FactionID > 1 &&
    //   myAvatar.getRep(param1.FactionID) < param1.iReqRep
    // ) {
    //   rootClass.MsgBox.notify("Item Locked: Reputation Requirement not met.");
    // } else if (!rootClass.validateArmor(param1)) {
    //   rootClass.MsgBox.notify("Item Locked: Class Requirement not met.");
    // } else if (
    //   param1.iQSindex >= 0 &&
    //   getQuestValue(param1.iQSindex) < int(param1.iQSvalue)
    // ) {
    //   rootClass.MsgBox.notify("Item Locked: Quest Requirement not met.");
    // } else if (
    //   (myAvatar.isItemInInventory(param1.ItemID) ||
    //     myAvatar.isItemInBank(param1.ItemID)) &&
    //   myAvatar.isItemStackMaxed(param1.ItemID)
    // ) {
    //   rootClass.MsgBox.notify(
    //     "You cannot have more than " + param1.iStk + " of that item!",
    //   );
    // } else if (param1.bCoins == 0 && param1.iCost > myAvatar.objData.intGold) {
    //   rootClass.MsgBox.notify("Insufficient Funds!");
    // } else if (param1.bCoins == 1 && param1.iCost > myAvatar.objData.intCoins) {
    //   rootClass.MsgBox.notify("Insufficient Funds!");
    // } else if (
    //   (!rootClass.isHouseItem(param1) &&
    //     myAvatar.items.length >= myAvatar.objData.iBagSlots) ||
    //   (rootClass.isHouseItem(param1) &&
    //     myAvatar.houseitems.length >= myAvatar.objData.iHouseSlots)
    // ) {
    //   rootClass.MsgBox.notify("Inventory Full!");
    // }

    return true;
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
