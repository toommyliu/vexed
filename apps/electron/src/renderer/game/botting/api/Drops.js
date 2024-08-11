const { Mutex } = require('async-mutex');

class Drops {
	#mutex = new Mutex();
	#data = new Set();
	#drops = {};

	constructor(bot) {
		/**
		 * @type {import('./Bot')}
		 */
		this.bot = bot;
	}

	/**
	 * @returns {Record<number, number>}
	 */
	get stack() {
		return this.#drops;
	}

	/**
	 * @param {number} itemID
	 * @returns {?ItemData}
	 */
	getItemFromID(itemID) {
		return [...this.#data].find((item) => item.ItemID === itemID);
	}

	/**
	 * @param {string} itemName
	 * @returns {?ItemData}
	 */
	getItemFromName(itemName) {
		itemName = itemName.toLowerCase();
		return [...this.#data].find(
			(item) => item.sName.toLowerCase() === itemName,
		);
	}

	/**
	 * @param {number} itemID
	 * @returns {?string}
	 */
	getNameFromID(itemID) {
		return this.getItemFromID(itemID)?.sName;
	}

	/**
	 * @param {string} itemName
	 * @returns {?number}
	 */
	getIDFromName(itemName) {
		return this.getItemFromName(itemName)?.ItemID;
	}

	/**
	 * Returns the count of the item in the drop stack. Returns -1 if it hasn't dropped.
	 * @param {number} itemID
	 * @returns {number}
	 */
	getDropCount(itemID) {
		return this.#drops[itemID] ?? -1;
	}

	/**
	 * Adds an item to the internal store and the stack as visible to the client.
	 * @param {ItemData} itemData The data of the item to add.
	 * @returns {void}
	 */
	addDrop(itemData) {
		this.#data.add(itemData);

		const { ItemID: itemID, sName: itemName, iQty: quantity } = itemData;

		this.#drops[itemID] ??= 0;
		this.#drops[itemID] += quantity;
	}

	/**
	 * Removes an item from the drop stack. This does not reject the drop.
	 * @param {number} itemID
	 * @returns {void}
	 * @private
	 */
	#removeDrop(itemID) {
		delete this.#drops[itemID];
	}

	/**
	 * Accepts the drop for an item in the stack
	 * @param {string|number} itemKey The item name or ID
	 * @returns {Promise<void>}
	 */
	async pickup(itemKey) {
		const item =
			this.getItemFromID(itemKey) || this.getItemFromName(itemKey);
		if (item) {
			const { ItemID: itemID } = item;
			await this.#mutex.runExclusive(async () => {
				if (this.#drops[itemID] > 0) {
					this.bot.packets.sendServer(
						`%xt%zm%getDrop%${this.bot.world.roomID}%${itemID}%`,
					);
					this.#removeDrop(itemID);
					await this.bot.waitUntil(
						() => this.bot.inventory.get(itemKey),
						() => this.bot.auth.loggedIn,
						-1,
					);
				}
			});
		}
	}

	/**
	 * Rejects the drop, effectively removing from the stack. Items can technically be picked up after the fact
	 * @param {string|number} itemKey The name or ID of the item
	 * @returns {Promise<void>}
	 */
	async reject(itemKey) {
		const item =
			this.getItemFromID(itemKey) || this.getItemFromName(itemKey);
		if (item) {
			this.bot.flash.call(swf.RejectDrop, item.sName, item.ItemID);
			this.#removeDrop(item.ItemID);
		}
	}
}

module.exports = Drops;

/**
 * @typedef {import('./struct/Item').ItemData} ItemData
 */
