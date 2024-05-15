class TempInventory {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;
	}

	/**
	 * Gets items in the Temp Inventory of the current player.
	 * @returns {TempInventoryItem[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetTempItems)?.map((data) => new TempInventoryItem(data));
	}

	/**
	 * Checks if the Temp Inventory contains an item with some desired quantity.
	 * @param {string} itemName - The name of the item.
	 * @param {string|number} [quantity="*"] - The quantity of the item to match against.
	 * @returns {boolean}
	 */
	contains(itemName, quantity = '*') {
		if (!this.items?.length) return false;

		const item = this.items.find((i) => i.name.toLowerCase() === itemName.toLowerCase());
		if (item) {
			// Match any quantity
			if (quantity === '*') return true;

			// Match max quantity
			if (quantity?.toLowerCase() === 'max') return item.quantity === item.maxStack;

			// Match quantity
			const quantity_ = Number.parseInt(quantity, 10);
			return quantity_ === item.quantity;
		}

		return false;
	}
}

class TempInventoryItem extends ItemBase {}
