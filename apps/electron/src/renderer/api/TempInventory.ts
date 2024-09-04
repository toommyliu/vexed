import TempInventoryItem from './struct/TempInventoryItem';
import type Bot from './Bot';

class TempInventory {
	public bot: Bot;

	public constructor(bot: Bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Gets items in the Temp Inventory of the current player.
	 * @returns {TempInventoryItem[]}
	 */
	public get items(): TempInventoryItem[] {
		const ret = this.bot.flash.call(swf.GetTempItems);
		if (Array.isArray(ret)) {
			return ret.map((data) => new TempInventoryItem(data));
		}
		return [];
	}

	/**
	 * Resolves for an item in the Temp Inventory.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @returns {TempInventoryItem|null}
	 */
	public get(itemKey: string | number): TempInventoryItem | null {
		if (typeof itemKey === 'string') {
			itemKey = itemKey.toLowerCase();
		}

		return (
			this.items.find((item) => {
				if (typeof itemKey === 'string') {
					return item.name.toLowerCase() === itemKey;
				}

				if (typeof itemKey === 'number') {
					return item.id === itemKey;
				}
				return null;
			}) ?? null
		);
	}

	/**
	 * Whether an item meets some quantity in this store.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @param {number} quantity The quantity of the item.
	 * @returns {boolean}
	 */
	public contains(itemKey: string | number, quantity: number): boolean {
		const item = this.get(itemKey);
		if (!item) {
			return false;
		}

		return item.quantity >= quantity;
	}
}

export default TempInventory;
