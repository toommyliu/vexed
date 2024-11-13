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
		return Array.isArray(ret)
			? ret.map(
					(data) =>
						new TempInventoryItem(data as unknown as ItemData),
				)
			: [];
	}

	/**
	 * Gets an item from the temp. inventory.
	 *
	 * @param itemKey - The name or ID of the item.
	 */
	public get(itemKey: number | string): TempInventoryItem | null {
		const val =
			typeof itemKey === 'string' ? itemKey.toLowerCase() : itemKey;

		return (
			this.items.find((item) => {
				if (typeof val === 'string') {
					return item.name.toLowerCase() === val;
				} else if (typeof val === 'number') {
					return item.id === val;
				}

				return false;
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
		return item !== null && item.quantity >= quantity;
	}
}
