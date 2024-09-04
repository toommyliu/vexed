import type Bot from './Bot';
import { GameAction } from './World';

class Shops {
	public bot: Bot;

	public constructor(bot: Bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Whether a shop is loaded.
	 * @returns {boolean}
	 */
	public get loaded(): boolean {
		return this.bot.flash.call(swf.IsShopLoaded);
	}

	/**
	 * The info about the current loaded shop.
	 * @returns {ShopInfo}
	 */
	get info() {
		return this.bot.flash.get('world.shopinfo', true);
	}

	/**
	 * Buy an item from the shop.
	 * @param {string} name The name of the item.
	 * @param {?number} quantity The quantity of the item.
	 * @returns {Promise<void>}
	 */
	public async buyByName(
		name: string,
		quantity: number | null,
	): Promise<void> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.BuyItem),
		);
		if (quantity) {
			this.bot.flash.call(swf.BuyItemQty, name, quantity);
			await this.bot.waitUntil(() => {
				const item = this.bot.inventory.get(name);
				if (item) {
					return item.quantity >= quantity;
				}
				return false;
			});
		} else {
			this.bot.flash.call(swf.BuyItem, name);
			await this.bot.waitUntil(() => {
				const item = this.bot.inventory.get(name);
				if (item) {
					return item.quantity >= 1;
				}
				return false;
			});
		}
	}

	/**
	 * Buy an item from the shop using its ID.
	 * @param {number} itemID The ID of the item.
	 * @param {number} shopItemID The ID of the item corresponding to the shopID.
	 * @param {number} quantity The quantity of the item.
	 * @returns {Promise<void>}
	 */
	public async buyByID(
		itemID: number,
		shopItemID: number,
		quantity: number,
	): Promise<void> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.BuyItem),
		);
		this.bot.flash.call(swf.BuyItemQtyById, quantity, itemID, shopItemID);
		await this.bot.waitUntil(() => {
			const item = this.bot.inventory.get(itemID);
			if (item) {
				return item.quantity >= quantity;
			}
			return false;
		});
	}

	/**
	 * Reset loaded shop info.
	 * @returns {void}
	 */
	public reset(): void {
		this.bot.flash.call(swf.ResetShopInfo);
	}

	/**
	 * Load a shop.
	 * @param {number} shopID
	 * @returns {Promise<void>}
	 */
	async load(shopID: number): Promise<void> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.LoadShop),
		);
		this.reset();
		this.bot.flash.call(swf.LoadShop, String(shopID));
		await this.bot.waitUntil(() => this.loaded);
	}

	/**
	 * Sells an entire stack of an item.
	 * @param {string} itemName
	 * @returns {Promise<boolean>} Whether the operation was successful.
	 */
	public async sell(itemName: string): Promise<boolean> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.SellItem),
		);

		const contains = () => this.bot.inventory.get(itemName);
		if (contains()) {
			await this.bot.sleep(1000);
			this.bot.flash.call(swf.SellItem, itemName);
			await this.bot.waitUntil(() => !contains());
			return true;
		}
		return false;
	}

	/**
	 * Loads a Hair Shop menu.
	 * @param {string|number} id
	 * @returns {void}
	 */
	public loadHairShop(id: string | number): void {
		this.bot.flash.call(swf.LoadHairShop, String(id));
	}

	/**
	 * Loads the Armor Customization menu.
	 * @returns {void}
	 */
	public loadArmorCustomise(): void {
		this.bot.flash.call(swf.LoadArmorCustomizer);
	}
}

/**
 * @typedef {Object} ShopInfo
 * @property {string} iIndex
 * @property {string} bStaff
 * @property {string} bHouse
 * @property {string} bUpgrd
 * @property {string} sName
 * @property {string} Location
 * @property {string} sField
 * @property {import('./struct/Item').ItemData[]} items
 * @property {string} ShopID
 */

export default Shops;
