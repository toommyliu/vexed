class TempInventory {
	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;
	}

	/**
	 * Gets items in the Temp Inventory of the current player.
	 * @returns {TempInventoryItem[]}
	 */
	get items() {
		return this.bot.flash
			.call(window.swf.GetTempItems)
			?.map((data) => new TempInventoryItem(data));
	}

	/**
	 * Resolves an item from the Bank.
	 * @param {string|number} itemResolvable The name or ID of the item.
	 * @returns {TempInventoryItem?}
	 */
	resolve(itemResolvable) {
		return this.items.find((i) => {
			if (typeof itemResolvable === 'string') {
				return i.name.toLowerCase() === itemResolvable.toLowerCase();
			}

			if (typeof itemResolvable === 'number') {
				return i.id === itemResolvable;
			}
		});
	}
}

class TempInventoryItem extends ItemBase {}
