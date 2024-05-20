class Shop {
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;
	}

	/**
	 * Whether the shop is loaded.
	 * @returns {boolean}
	 */
	get loaded() {
		return this.instance.flash.call(window.swf.IsShopLoaded);
	}

	/**
	 * The info about the current loaded shop.
	 * @returns {ShopInfo}
	 */
	get shopInfo() {
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
			await this.instance.waitUntil(
				() =>
					this.instance.inventory.items.find(
						(i) => i.name.toLowerCase() === name.toLowerCase(),
					).quantity >= quantity,
			);
		} else {
			this.instance.flash.call(window.swf.BuyItem, name);
			await this.instance.waitUntil(
				() =>
					this.instance.inventory.items.find(
						(i) => i.name.toLowerCase() === name.toLowerCase(),
					).quantity >= 1,
			);
		}
	}

	/**
	 * Buy an item from the shop using its Id.
	 * @param {number} itemId
	 * @param {number} shopItemId
	 * @param {number} quantity
	 * @returns {Promise<void>}
	 */
	async buyById(itemId, shopItemId, quantity) {
		await this.instance.waitUntil(() =>
			this.instance.world.isActionAvailable(GameAction.BuyItem),
		);

		this.instance.flash.call(
			window.swf.BuyItemQtyById,
			quantity,
			itemId,
			shopItemId,
		);

		await this.instance.waitUntil(
			() =>
				this.instance.inventory.items.find(
					(i) => i.id === itemId,
				).quantity >= quantity,
		);
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
	 * @param {number} shopId
	 * @returns {Promise<void>}
	 */
	async load(shopId) {
		await this.instance.waitUntil(() =>
			this.instance.world.isActionAvailable(GameAction.LoadShop),
		);
		this.reset();
		this.instance.flash.call(window.swf.LoadShop, String(shopId));
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
