class Shops {
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;
	}

	/**
	 * Whether a shop is loaded.
	 * @returns {boolean}
	 */
	get loaded() {
		return this.instance.flash.call(window.swf.IsShopLoaded);
	}

	/**
	 * The info about the current loaded shop.
	 * @returns {ShopInfo}
	 */
	get info() {
		return this.instance.flash.get("world.shopinfo", true);
	}

	/**
	 * Buy an item from the shop.
	 * @param {string} name
	 * @param {?number} quantity
	 * @returns {Promise<void>}
	 */
	async buyByName(name, quantity) {
		await this.instance.waitUntil(() =>
			this.instance.world.isActionAvailable(GameAction.BuyItem),
		);

		if (quantity) {
			this.instance.flash.call(window.swf.BuyItemQty, name, quantity);
			// await this.instance.waitUntil(
			// 	() =>
			// 		this.instance.inventory.items.find(
			// 			(i) => i.name.toLowerCase() === name.toLowerCase(),
			// 		).quantity >= quantity,
			// );
		} else {
			this.instance.flash.call(window.swf.BuyItem, name);
			// await this.instance.waitUntil(
			// 	() =>
			// 		this.instance.inventory.items.find(
			// 			(i) => i.name.toLowerCase() === name.toLowerCase(),
			// 		).quantity >= 1,
			// );
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
		await this.instance.waitUntil(() =>
			this.instance.world.isActionAvailable(GameAction.BuyItem),
		);

		this.instance.flash.call(
			window.swf.BuyItemQtyById,
			quantity,
			itemID,
			shopItemID,
		);

		// await this.instance.waitUntil(
		// 	() =>
		// 		this.instance.inventory.items.find(
		// 			(i) => i.id === itemID,
		// 		).quantity >= quantity,
		// );
	}

	/**
	 * Reset loaded shop info.
	 * @returns {void}
	 */
	reset() {
		this.instance.flash.call(window.swf.ResetShopInfo);
	}

	/**
	 * Load a shop.
	 * @param {number} shopID
	 * @returns {Promise<void>}
	 */
	async load(shopID) {
		await this.instance.waitUntil(() =>
			this.instance.world.isActionAvailable(GameAction.LoadShop),
		);
		this.reset();
		this.instance.flash.call(window.swf.LoadShop, String(shopID));
		await this.instance.waitUntil(() => this.loaded);
	}

	/**
	 * Sells an entire stack of an item.
	 * @param {string} itemName
	 * @returns {Promise<void>}
	 */
	async sell(itemName) {
		await this.instance.waitUntil(() =>
			this.instance.world.isActionAvailable(GameAction.SellItem),
		);

		const contains = () => this.instance.inventory.contains(itemName);
		if (contains()) {
			this.instance.flash.call(window.swf.SellItem, itemName);
			await this.instance.waitUntil(() => !contains());
		}
	}

	/**
	 * Loads a Hair Shop menu.
	 * @param {number} id
	 */
	loadHairShop(id) {
		this.instance.flash.call(window.swf.LoadHairShop, String(id));
	}

	/**
	 * Loads the Armor Customization menu.
	 * @returns {void}
	 */
	loadArmorCustomise() {
		this.instance.flash.call(window.swf.LoadArmorCustomizer);
	}
}

/**
 * @typedef {Object} ShopInfo
 */
