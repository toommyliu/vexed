import type { Bot } from './Bot';
import type { ItemData } from './struct/Item';
import { TempInventoryItem } from './struct/TempInventoryItem';

export class TempInventory {
	public constructor(public bot: Bot) {}

	/**
	 * Gets items in the Temp Inventory of the player.
	 */
	public get items(): TempInventoryItem[] {
		const ret = this.bot.flash.call(() => swf.GetTempItems());
		if (Array.isArray(ret)) {
			return ret.map(
				(data) => new TempInventoryItem(data as unknown as ItemData),
			);
		}

		return [];
	}

	/**
	 * Gets an item from the temp. inventory.
	 *
	 * @param itemKey - The name or ID of the item.
	 */
	public get(itemKey: number | string): TempInventoryItem | null {
		const key =
			typeof itemKey === 'string' ? itemKey.toLowerCase() : itemKey;

		return (
			this.items.find((item) => {
				if (typeof key === 'string') {
					return item.name.toLowerCase() === key;
				} else if (typeof key === 'number') {
					return item.id === key;
				} else {
					return null;
				}
			}) ?? null
		);
	}

	/**
	 * Whether an item meets some quantity in this store.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @param quantity - The quantity of the item.
	 * @returns Whether the item meets some quantity in this store.
	 */
	public contains(itemKey: number | string, quantity: number): boolean {
		const item = this.get(itemKey);
		if (!item) {
			return false;
		}

		return item.quantity >= quantity;
	}
}
