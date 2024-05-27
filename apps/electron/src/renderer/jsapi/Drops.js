class Drops {
	/**
	 * Internal store of item data.
	 * @type {Set<ItemData>}
	 */
	#data = new Set();
	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		this.bot = bot;

		/**
		 * The items dropped and their quantity. Maps item ID to their quantity.
		 * @type {Map<number, number>}
		 */
		this.stack = new Map();
		this.busy = false;
	}

	/**
	 * Adds an item to the drop stack.
	 * @param {ItemData} itemData The item to add.
	 * @returns {void}
	 */
	addToStack(itemData) {
		this.#data.add(itemData);
		const p = this.stack.get(itemData.ItemID) ?? 0;
		this.stack.set(itemData.ItemID, itemData.iQty + p);
	}

	/**
	 * Removes an item from the drop stack.
	 * @param {number} itemID The ID of the item to remove.
	 * @returns {void}
	 */
	removeFromStack(itemID) {
		this.stack.delete(itemID);
	}

	/**
	 * Collects an item from the drop stack, effectively removing it from the stack.
	 * @param {string|number} item The name or ID of the item to collect.
	 * @returns {Promise<void>}
	 */
	async pickup(item) {
		if (typeof item === 'string')
			item = [...this.#data.values()].find(i => i.sName.toLowerCase() === item.toLowerCase())?.ItemID;

		// probably not necessary
		while (this.busy) 
			await this.bot.sleep(100);

		const exists = this.stack.has(item);
		if (exists) {
			this.busy = true;
			bot.packets.sendServer(`%xt%zm%getDrop%${bot.world.roomId}%${item}%`);
			await bot.sleep(300);
			this.removeFromStack(item);
			this.busy = false;
		}
	}
}
