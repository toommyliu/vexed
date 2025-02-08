import type { Bot } from './Bot';
import type { ItemData } from './models/Item';
import { TempInventoryItem } from './models/TempInventoryItem';

export class TempInventory {
	public constructor(public bot: Bot) {}

	/**
	 * A list of items in the temp inventory.
	 */
	public get items(): TempInventoryItem[] {
		const ret = this.bot.flash.call(() => swf.tempInventoryGetItems());
		return Array.isArray(ret)
			? ret.map(
					(data) =>
						new TempInventoryItem(data as unknown as ItemData),
				)
			: [];
	}

	/**
	 * Gets an item from the temp inventory.
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
	 * Whether an item meets the quantity in the temp inventory.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @param quantity - The quantity of the item.
	 */
	public contains(itemKey: number | string, quantity: number): boolean {
		const item = this.get(itemKey);
		return item !== null && item.quantity >= quantity;
	}
}
