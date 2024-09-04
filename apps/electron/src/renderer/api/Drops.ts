import { Mutex } from 'async-mutex';
import type Bot from './Bot';
import type { ItemData } from './struct/Item';

class Drops {
	#mutex = new Mutex();
	#data: Set<ItemData> = new Set();
	#drops: Record<number, number> = {};

	public bot: Bot;

	public constructor(bot: Bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * The drop stack as shown to the client. The mapping is of the form `itemID -> count`.
	 * @returns {Record<number, number>}
	 * @property
	 */
	public get stack() {
		return this.#drops;
	}

	/**
	 * @param {number} itemID The ID of the item.
	 * @returns {?import('./struct/Item').ItemData} The item data, if the item has previously dropped.
	 */
	public getItemFromID(itemID: number): ItemData | undefined {
		return [...this.#data].find((item) => item.ItemID === itemID);
	}

	/**
	 * @param {string} itemName The name of the item.
	 * @returns {?import('./struct/Item').ItemData} The item data, if the item has previously dropped.
	 */
	getItemFromName(itemName: string): ItemData | undefined {
		itemName = itemName.toLowerCase();
		return [...this.#data].find(
			(item) => item.sName.toLowerCase() === itemName,
		);
	}

	/**
	 * @param {number} itemID The ID of the item.
	 * @returns {?string} The name of the item, if the item has previously dropped.
	 */
	public getNameFromID(itemID: number): string | undefined {
		return this.getItemFromID(itemID)?.sName;
	}

	/**
	 * @param {string} itemName The name of the item.
	 * @returns {?number} The ID of the item, if the item has previously dropped.
	 */
	getIDFromName(itemName: string): number | undefined {
		return this.getItemFromName(itemName)?.ItemID;
	}

	/**
	 * Retrieves the count of the item in the drop stack.
	 * @param {number} itemID The ID of the item.
	 * @returns {number} The count of the item in the stack. The value is -1 if the item has not been dropped.
	 */
	getDropCount(itemID: number): number {
		return this.#drops[itemID] ?? -1;
	}

	/**
	 * Adds an item to the internal store and the stack as visible to the client.
	 * @param {Record<string, unknown>} itemData The data of the item to add.
	 * @returns {void}
	 * @private
	 *
	 * The parser breaks here. The type is ItemData
	 */
	addDrop(itemData: ItemData): void {
		this.#data.add(itemData);

		const { ItemID: itemID, iQty: quantity } = itemData;

		this.#drops[itemID] ??= 0;
		this.#drops[itemID] += quantity;
	}

	/**
	 * Removes an item from the drop stack. This does not reject the drop.
	 * @param {number} itemID The ID of the item to remove.
	 * @returns {void}
	 * @private
	 */
	removeDrop(itemID: number): void {
		delete this.#drops[itemID];
	}

	/**
	 * Accepts the drop for an item in the stack.
	 * @param {string|number} itemKey The item name or ID.
	 * @returns {Promise<boolean>} Whether the operation was successful.
	 */
	async pickup(itemKey: string | number): Promise<boolean> {
		const item = this.#resolveItem(itemKey);
		if (item && this.getDropCount(item.ItemID) > 0) {
			const { ItemID: itemID } = item;
			await this.#mutex.runExclusive(async () => {
				this.bot.packets.sendServer(
					`%xt%zm%getDrop%${this.bot.world.roomID}%${itemID}%`,
				);
				this.removeDrop(itemID);
				await this.bot.waitUntil(
					() => this.bot.inventory.get(itemKey),
					() => this.bot.auth.loggedIn,
					-1,
				);
				return true;
			});
		}
		return false;
	}

	/**
	 * Rejects the drop, effectively removing from the stack. Items can still be picked up with a getDrop packet.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @param {boolean} [removeFromStore=false] Whether to delete the item entry from the store.
	 * @returns {Promise<boolean>} Whether the operation was successful.
	 */
	async reject(
		itemKey: string | number,
		removeFromStore = false,
	): Promise<boolean> {
		const item = this.#resolveItem(itemKey);
		if (item) {
			this.bot.flash.call(swf.RejectDrop, item.sName, item.ItemID);
			if (removeFromStore) {
				this.removeDrop(item.ItemID);
			}
			return true;
		}
		return false;
	}

	/**
	 * Resolves for an item by its' name or itemID.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @returns {ItemData|undefined}
	 */
	#resolveItem(itemKey: string | number): ItemData | undefined {
		if (typeof itemKey === 'string') {
			return this.getItemFromName(itemKey);
		} else if (typeof itemKey === 'number') {
			return this.getItemFromID(itemKey);
		}
		return undefined;
	}
}

export default Drops;
