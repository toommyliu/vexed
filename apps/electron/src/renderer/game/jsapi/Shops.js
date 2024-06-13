class Shops {
	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;
	}

	/**
	 * Whether a shop is loaded.
	 * @returns {boolean}
	 */
	get loaded() {
		return this.bot.flash.call(window.swf.IsShopLoaded);
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
	 * @param {string} name
	 * @param {?number} quantity
	 * @returns {Promise<void>}
	 */
	async buyByName(name, quantity) {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.BuyItem),
		);
		if (quantity) {
			this.bot.flash.call(window.swf.BuyItemQty, name, quantity);
			await this.bot.waitUntil(
				() => this.bot.inventory.resolve(name)?.quantity >= quantity,
			);
		} else {
			this.bot.flash.call(window.swf.BuyItem, name);
			await this.bot.waitUntil(
				() => this.bot.inventory.resolve(name)?.quantity >= 1,
			);
		}
	}

	/**
	 * Buy an item from the shop using its ID.
	 * @param {number} itemID
	 * @param {number} shopItemID
	 * @param {number} quantity
	 * @returns {Promise<void>}
	 */
	async buyByID(itemID, shopItemID, quantity) {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.BuyItem),
		);
		this.bot.flash.call(
			window.swf.BuyItemQtyById,
			quantity,
			itemID,
			shopItemID,
		);
		await this.bot.waitUntil(
			() => this.bot.inventory.resolve(itemID)?.quantity >= quantity,
		);
	}

	/**
	 * Reset loaded shop info.
	 * @returns {void}
	 */
	reset() {
		this.bot.flash.call(window.swf.ResetShopInfo);
	}

	/**
	 * Load a shop.
	 * @param {number} shopID
	 * @returns {Promise<void>}
	 */
	async load(shopID) {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.LoadShop),
		);
		this.reset();
		this.bot.flash.call(window.swf.LoadShop, String(shopID));
		await this.bot.waitUntil(() => this.loaded);
	}

	/**
	 * Sells an entire stack of an item.
	 * @param {string} itemName
	 * @returns {Promise<void>}
	 */
	async sell(itemName) {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.SellItem),
		);

		const contains = () => this.bot.inventory.resolve(itemName);
		if (contains()) {
			await this.bot.sleep(1000);
			this.bot.flash.call(window.swf.SellItem, itemName);
			await this.bot.waitUntil(() => !contains());
		}
	}

	/**
	 * Loads a Hair Shop menu.
	 * @param {number} id
	 */
	loadHairShop(id) {
		this.bot.flash.call(window.swf.LoadHairShop, String(id));
	}

	/**
	 * Loads the Armor Customization menu.
	 * @returns {void}
	 */
	loadArmorCustomise() {
		this.bot.flash.call(window.swf.LoadArmorCustomizer);
	}
}

/**
 * @typedef {Object} ShopInfo
 */
