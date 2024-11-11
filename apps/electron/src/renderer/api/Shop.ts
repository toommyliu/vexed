import type { Bot } from './Bot';
import { GameAction } from './World';
import type { ItemData } from './struct/Item';

export class Shops {
	public constructor(public bot: Bot) {}

	/**
	 * Whether any shop is loaded.
	 */
	public isShopLoaded(): boolean {
		return this.bot.flash.call(() => swf.IsShopLoaded());
	}

	/**
	 * The info about the current loaded shop.
	 */
	public get info(): ShopInfo | null {
		return this.bot.flash.get('world.shopinfo', true);
	}

	/**
	 * Buy an item from the shop.
	 *
	 * @param itemName - The name of the item.
	 * @param quantity - The quantity of the item.
	 */
	public async buyByName(
		itemName: string,
		quantity: number | null,
	): Promise<void> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.BuyItem),
		);
		if (quantity) {
			this.bot.flash.call(() => swf.BuyItemQty(itemName, quantity));
			await this.bot.waitUntil(() =>
				this.bot.inventory.contains(itemName, quantity),
			);
		} else {
			this.bot.flash.call(() => swf.BuyItem(itemName));
			await this.bot.waitUntil(() =>
				this.bot.inventory.contains(itemName, 1),
			);
		}
	}

	/**
	 * Buy an item from the shop using its ID.
	 *
	 * @param itemID - The ID of the item.
	 * @param shopItemID - The ID of the item corresponding to the shopID.
	 * @param quantity -The quantity of the item.
	 */
	public async buyByID(
		itemID: number,
		shopItemID: number,
		quantity: number,
	): Promise<void> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.BuyItem),
		);
		this.bot.flash.call(() =>
			swf.BuyItemQtyById(quantity, itemID, shopItemID),
		);
		await this.bot.waitUntil(() =>
			this.bot.inventory.contains(itemID, quantity),
		);
	}

	/**
	 * Reset the loaded shop info.
	 */
	public resetShopInfo(): void {
		this.bot.flash.call(() => swf.ResetShopInfo());
	}

	/**
	 * Load a shop.
	 *
	 * @param shopID - The shop ID.
	 */
	public async load(shopID: number | string): Promise<void> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.LoadShop),
		);
		this.resetShopInfo();
		this.bot.flash.call(() => swf.LoadShop(String(shopID)));
		await this.bot.waitUntil(() => this.isShopLoaded());
	}

	/**
	 * Sells an entire stack of an item.
	 *
	 * @param itemName - The name of the item.
	 * @returns Whether the operation was successful.
	 */
	public async sell(itemName: string): Promise<boolean> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.SellItem),
		);

		const hasItem = () => this.bot.inventory.get(itemName);
		if (hasItem()) {
			await this.bot.sleep(1_000);
			this.bot.flash.call(() => swf.SellItem(itemName));
			await this.bot.waitUntil(() => !hasItem());
			return true;
		}

		return false;
	}

	/**
	 * Loads a hair shop.
	 *
	 * @param shopID - The shop ID.
	 */
	public loadHairShop(shopID: number | string): void {
		this.bot.flash.call(() => swf.LoadHairShop(String(shopID)));
	}

	/**
	 * Opens the Armor Customization menu.
	 */
	public openArmorCustomizer(): void {
		this.bot.flash.call(() => swf.LoadArmorCustomizer());
	}
}

export type ShopInfo = {
	Location: string;
	ShopID: string;
	bHouse: string;
	bStaff: string;
	bUpgrd: string;
	iIndex: string;
	items: ItemData[];
	sField: string;
	sName: string;
};
