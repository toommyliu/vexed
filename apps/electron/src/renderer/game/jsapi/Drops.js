var { Mutex } = require('async-mutex');

class Drops {
	/**
	 * Internal store of item data.
	 * @type {Set<ItemData>}
	 */
	#data = new Set();

	#mutex = new Mutex();

	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;

		/**
		 * The items dropped and their quantity. Maps item ID to their quantity.
		 * @type {Map<number, number>}
		 */
		this.stack = new Map();
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
	 * Resets the drop stack to a clean state.
	 * @returns {void}
	 */
	reset() {
		this.#data.clear();
		this.stack.clear();
	}

	/**
	 * Collects an item from the drop stack, effectively removing it from the stack.
	 * @param {string|number} itemResolvable The name or ID of the item to collect.
	 * @returns {Promise<void>}
	 */
	async pickup(itemResolvable) {
		let item;
		if (typeof itemResolvable === 'string') {
			item = [...this.#data.values()].find(
				(i) => i.sName.toLowerCase() === itemResolvable.toLowerCase(),
			)?.ItemID;
		}

		const exists = this.stack.has(item);
		if (!exists) {
			return;
		}

		await this.#mutex.acquire();

		bot.packets.sendServer(`%xt%zm%getDrop%${bot.world.roomId}%${item}%`);
		await bot.sleep(300);
		this.removeFromStack(item);

		this.#mutex.release();
	}
}
