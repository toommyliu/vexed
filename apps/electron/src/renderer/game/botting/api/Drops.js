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
	 * The drop stack as shown to the client. The mapping is of the form `ItemID -> count`.
	 * @returns {Record<number, number>}
	 * @property
	 */
	get stack() {
		return this.#drops;
	}

	/**
	 * @param {number} itemID The ID of the item
	 * @returns {?import('./struct/Item').ItemData} The item data, if the item has previously dropped
	 */
	getItemFromID(itemID) {
		return [...this.#data].find((item) => item.ItemID === itemID);
	}

	/**
	 * @param {string} itemName The name of the item
	 * @returns {?import('./struct/Item').ItemData} The item data, if the item has previously dropped
	 */
	getItemFromName(itemName) {
		itemName = itemName.toLowerCase();
		return [...this.#data].find(
			(item) => item.sName.toLowerCase() === itemName,
		);
	}

	/**
	 * @param {number} itemID The ID of the item
	 * @returns {?string} The name of the item, if the item has previously dropped
	 */
	getNameFromID(itemID) {
		return this.getItemFromID(itemID)?.sName;
	}

	/**
	 * @param {string} itemName The name of the item
	 * @returns {?number} The ID of the item, if the item has previously dropped
	 */
	getIDFromName(itemName) {
		return this.getItemFromName(itemName)?.ItemID;
	}

	/**
	 * Returns the count of the item in the drop stack. Returns -1 if it hasn't dropped.
	 * @param {number} itemID The ID of the item
	 * @returns {number} The count of the item in the stack
	 */
	getDropCount(itemID) {
		return this.#drops[itemID] ?? -1;
	}

	/**
	 * Adds an item to the internal store and the stack as visible to the client.
	 * @param {Record<string, any>} itemData The data of the item to add. See {@link ItemData}
	 * @returns {void}
	 * @private
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
	 * @param {boolean} [removeFromStore=false] Whether to delete the item entry from the store
	 * @returns {Promise<void>}
	 */
	async reject(itemKey, removeFromStore = false) {
		const item =
			this.getItemFromID(itemKey) || this.getItemFromName(itemKey);
		if (item) {
			this.bot.flash.call(swf.RejectDrop, item.sName, item.ItemID);
			if (removeFromStore) {
				this.#removeDrop(item.ItemID);
			}
		}
	}
}

module.exports = Drops;
